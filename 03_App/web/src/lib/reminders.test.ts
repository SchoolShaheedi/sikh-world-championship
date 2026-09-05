/**
 * The reminder email.
 *
 * `applicationOutcome` has promised "we will email again with the venue address and what
 * to bring" since it was written, and nothing sent it. What these pin is the behaviour
 * that decides whether it is safe to press: it goes to the people with places and nobody
 * else, an under-18's guardian gets their own copy with the collection rule on it, and
 * pressing it twice does not email sixty-four children again.
 */
import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { getDb } from "./db";
import { apply } from "./store";
import { sendEventReminders, reminderSummary } from "./reminders";
import type { ChampionshipEvent } from "./types";

beforeAll(useTempDataDir);
beforeEach(async () => {
  await clearDataDir();
  process.env.RESEND_API_KEY = "test-key";
  vi.restoreAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ id: "sent" }), { status: 200 })),
  );
});
afterEach(() => {
  delete process.env.RESEND_API_KEY;
  vi.unstubAllGlobals();
});

const SLUG = "e1";

const EVENT = {
  slug: SLUG,
  title: "Sikh FC 27 Championship",
  date: "2026-10-03",
  times: "09:30 – 16:30",
  venue: {
    name: "GNG FC — Riverside Football Ground",
    addressLines: ["51 Braunstone Lane East", "Braunstone Town", "Leicester"],
    postcode: "LE3 2FD",
    mapsUrl: "https://maps.example.com/gng",
  },
  detailsConfirmed: true,
} as unknown as ChampionshipEvent;

async function entrant(opts: {
  name: string;
  status: string;
  dob?: string;
  guardianEmail?: string;
  mayLeave?: boolean;
}) {
  const email = `${opts.name.replace(/\s+/g, "").toLowerCase()}@example.com`;
  const r = await apply({
    eventSlug: SLUG,
    divisionId: "open",
    answers: {
      fullName: opts.name,
      dob: opts.dob ?? "2006-05-02",
      email,
      mobile: "07700900123",
      referralOrg: "Nobody — I found it myself",
      ...(opts.guardianEmail ? { guardianEmail: opts.guardianEmail } : {}),
      ...(opts.mayLeave ? { mayLeaveUnaccompanied: true } : {}),
    },
    playerId: null,
  });
  const db = await getDb();
  await db
    .prepare("UPDATE registrations SET status = ? WHERE reference = ?")
    .bind(opts.status, r.reference)
    .run();
  return r;
}

/** What actually left the building, from the table that records it. */
async function sends(): Promise<{ kind: string; to_email: string; status: string }[]> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT kind, to_email, status FROM email_sends ORDER BY kind, to_email")
    .all<{ kind: string; to_email: string; status: string }>();
  return results;
}

describe("who gets one", () => {
  it("goes to everybody with a place, and to nobody else", async () => {
    await entrant({ name: "Has Place", status: "selected" });
    await entrant({ name: "Has Arrived", status: "checked-in" });
    await entrant({ name: "Still Waiting", status: "applied" });
    await entrant({ name: "Not Drawn", status: "not-selected" });

    const r = await sendEventReminders(EVENT);
    expect(r.sent).toBe(2);

    const to = (await sends()).map((s) => s.to_email);
    expect(to).toContain("hasplace@example.com");
    expect(to).toContain("hasarrived@example.com");
    // Telling somebody who was not drawn what to bring is a cruelty and a phone call.
    expect(to).not.toContain("stillwaiting@example.com");
    expect(to).not.toContain("notdrawn@example.com");
  });

  it("sends an under-18's guardian their own, not a copy of the child's", async () => {
    await entrant({
      name: "Young Player",
      status: "selected",
      dob: "2013-05-02",
      guardianEmail: "parent@example.com",
    });

    const r = await sendEventReminders(EVENT);
    expect(r.sent).toBe(1);
    expect(r.guardians).toBe(1);

    const kinds = (await sends()).map((s) => `${s.kind}:${s.to_email}`);
    expect(kinds).toContain("event-reminder:youngplayer@example.com");
    expect(kinds).toContain("event-reminder-guardian:parent@example.com");
  });

  it("sends an adult's guardian nothing, because there is not one", async () => {
    await entrant({
      name: "Adult Player",
      status: "selected",
      dob: "1999-05-02",
      // An address left on the record from a previous life must not pull an email.
      guardianEmail: "parent@example.com",
    });
    const r = await sendEventReminders(EVENT);
    expect(r.guardians).toBe(0);
  });
});

describe("pressing it twice", () => {
  it("emails the new people and reports the rest as already having it", async () => {
    await entrant({ name: "First Batch", status: "selected" });
    expect((await sendEventReminders(EVENT)).sent).toBe(1);

    await entrant({ name: "Backfilled Later", status: "selected" });
    const second = await sendEventReminders(EVENT);
    expect(second.sent).toBe(1);
    expect(second.skipped).toBe(1);
  });
});

describe("what the panel says before anybody presses anything", () => {
  it("counts the audience and what has already gone", async () => {
    await entrant({ name: "One Person", status: "selected" });
    await entrant({ name: "Two Person", status: "checked-in" });

    expect(await reminderSummary(EVENT)).toEqual({
      withPlace: 2,
      alreadySent: 0,
      guardiansSent: 0,
    });

    await sendEventReminders(EVENT);
    const after = await reminderSummary(EVENT);
    expect(after.alreadySent).toBe(2);
  });
});

describe("what is in it", () => {
  it("carries the street address — the only email that does", async () => {
    await entrant({ name: "Has Place", status: "selected" });
    await sendEventReminders(EVENT);

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.text).toContain("51 Braunstone Lane East");
    expect(body.text).toContain("LE3 2FD");
    expect(body.text).toContain("09:30 – 16:30");
    // Every statement of the photography condition names the way out — invariant 12.
    expect(body.text).toMatch(/not be photographed/i);
    expect(body.text).toContain("/support");
  });

  it("keeps its paragraph breaks in the plain-text version", async () => {
    // The first version filtered every empty string out of the line array to drop an
    // absent venue line, and took every deliberate blank with it — turning the half of
    // the email that some parents actually read into one unbroken wall.
    await entrant({ name: "Has Place", status: "selected" });
    await sendEventReminders(EVENT);
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.text).toMatch(/\n\nWHERE\n/);
    expect(body.text).toMatch(/\n\nBRING\n/);
  });

  it("tells a 12-year-old's guardian they have to stay, in as many words", async () => {
    await entrant({
      name: "Young Player",
      status: "selected",
      dob: "2014-05-02",
      guardianEmail: "parent@example.com",
    });
    await sendEventReminders(EVENT);

    const guardian = vi
      .mocked(fetch)
      .mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string))
      .find((b) => b.to[0] === "parent@example.com");
    expect(guardian.text).toMatch(/stay at the venue/i);
  });

  it("tells a 16-year-old's guardian which way the leaving permission went", async () => {
    await entrant({
      name: "Older Child",
      status: "selected",
      dob: "2010-05-02",
      guardianEmail: "parent@example.com",
      mayLeave: true,
    });
    await sendEventReminders(EVENT);

    const guardian = vi
      .mocked(fetch)
      .mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string))
      .find((b) => b.to[0] === "parent@example.com");
    expect(guardian.text).toMatch(/leave on their own/i);
    expect(guardian.text).not.toMatch(/must be collected/i);
  });
});
