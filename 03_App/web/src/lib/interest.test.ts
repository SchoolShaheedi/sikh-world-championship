/**
 * Tests for registering interest.
 *
 * Two things happen here that are hard to take back: a profile comes into existence, and
 * a parent who has never heard of us receives an email about their child. Both are
 * asserted, including the case that matters most — that the guardian is told at all.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { registerInterest } from "./interest";
import { registrationsFor } from "./store";
import { playerByEmail } from "./players";
import { getDb } from "./db";
import { getEvent } from "@/data/events";

const event = getEvent("sikh-fc-27")!;
const division = event.divisions[0];

beforeAll(useTempDataDir);
beforeEach(async () => {
  await clearDataDir();
  process.env.RESEND_API_KEY = "test-key";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ id: "e1" }), { status: 200 })),
  );
});

function answers(over: Record<string, unknown> = {}) {
  return {
    fullName: "Tegh Singh",
    dob: "2013-05-02",
    email: "tegh@example.com",
    mobile: "07700900123",
    region: "Leicester",
    referralOrg: "Basics of Sikhi",
    guardianName: "Harjit Kaur",
    guardianEmail: "parent@example.com",
    psnId: "tegh_mcr",
    avatarId: "kesri-1",
    ...over,
  } as Record<string, string | boolean | string[]>;
}

/** What actually left the building, from the send log rather than the mocked transport. */
async function sends() {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT kind, to_email, status FROM email_sends ORDER BY kind")
    .all<{ kind: string; to_email: string; status: string }>();
  return results;
}

describe("registering interest", () => {
  it("creates a profile at submission, not at selection", async () => {
    await registerInterest(event, division, answers());

    const player = await playerByEmail("tegh@example.com");
    expect(player).not.toBeNull();
    expect(player!.displayName).toBe("Tegh");
    expect(player!.ageBand).toBe("U16");
    expect(player!.gamertag).toBe("tegh_mcr");
    // Neither is ever granted by filling in a form.
    expect(player!.isModerator).toBe(false);
    expect(player!.eventVerified).toBe(false);
  });

  it("gives the profile a public name, defaulted when the box was left blank", async () => {
    await registerInterest(event, division, answers());

    const player = await playerByEmail("tegh@example.com");
    // First name plus last initial. NOT "tegh_mcr" — a PSN ID on a projector is a contact
    // route, and NOT "Tegh Singh" — the surname is never public.
    expect(player!.handle).toBe("Tegh S.");
  });

  it("never stores the PSN ID as the public name, even if it arrives as one", async () => {
    // The validator rejects this before it reaches here, so this asserts the last line:
    // resolveHandle falls back rather than letting the ID through to the bracket.
    await registerInterest(event, division, answers({ handle: "tegh_mcr" }));

    const player = await playerByEmail("tegh@example.com");
    expect(player!.handle).toBe("Tegh S.");
  });

  it("keeps a handle the player chose", async () => {
    await registerInterest(event, division, answers({ handle: "TeghTheGreat" }));
    expect((await playerByEmail("tegh@example.com"))!.handle).toBe("TeghTheGreat");
  });

  it("links the application to that profile", async () => {
    const result = await registerInterest(event, division, answers());
    const [reg] = await registrationsFor(event.slug);

    expect(reg.playerId).toBe(result.playerId);
    expect(reg.status).toBe("applied");
    // Still not a place: no check-in token exists until someone is drawn.
    expect(reg.checkInToken).toBeFalsy();
  });

  it("emails the applicant and, for an under-18, the guardian too", async () => {
    await registerInterest(event, division, answers());

    expect(await sends()).toEqual([
      { kind: "guardian-interest-notice", to_email: "parent@example.com", status: "sent" },
      { kind: "interest-received", to_email: "tegh@example.com", status: "sent" },
    ]);
  });

  it("does not email a guardian for an adult applicant", async () => {
    await registerInterest(
      event,
      division,
      answers({ dob: "2000-01-01", guardianEmail: undefined }),
    );

    const kinds = (await sends()).map((s) => s.kind);
    expect(kinds).toEqual(["interest-received"]);
  });

  /**
   * The failure this guards against: a second event mints a second account, and the
   * person ends up with two profiles, two trophy cabinets and a sign-in link that reaches
   * whichever one was created last.
   */
  it("reuses the profile when the same person registers for a second event", async () => {
    const first = await registerInterest(event, division, answers());
    const second = await registerInterest(
      event,
      division,
      answers({ region: "Birmingham" }),
    );

    expect(second.playerId).toBe(first.playerId);
    expect((await registrationsFor(event.slug)).length).toBe(2);
    // Details a later registration is more likely to have right do get updated.
    expect((await playerByEmail("tegh@example.com"))!.region).toBe("Birmingham");
  });

  /**
   * A failed email must never lose an application that is already saved. The alternative
   * is someone who filled in the form, saw an error, and has no record with us.
   */
  it("still records the application when sending fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    const result = await registerInterest(event, division, answers());

    expect(result.reference).toMatch(/^SWC-/);
    expect((await registrationsFor(event.slug)).length).toBe(1);
    expect((await sends()).every((s) => s.status === "failed")).toBe(true);
  });
});
