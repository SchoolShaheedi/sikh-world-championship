/**
 * Tests for turning a drawn application into a place.
 *
 * This is the moment an account comes into existence and a real person is emailed to say
 * they are coming. Both are hard to take back, so both are asserted.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { useTempDataDir, clearDataDir } from "./test-helpers";
import { apply, registrationsFor } from "./store";
import { confirmSelection, notifyNotSelected } from "./selection";
import { playerByEmail } from "./players";
import { getDb } from "./db";
import { getEvent } from "@/data/events";

const event = getEvent("sikh-fc-27")!;

beforeAll(useTempDataDir);
beforeEach(async () => {
  await clearDataDir();
  process.env.RESEND_API_KEY = "test-key";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ id: "e1" }), { status: 200 })),
  );
});

async function applied(over: Record<string, unknown> = {}) {
  await apply({
    eventSlug: event.slug,
    divisionId: "open",
    answers: {
      fullName: "Tegh Singh",
      dob: "2013-05-02",
      email: "tegh@example.com",
      mobile: "07700900123",
      region: "Leicester",
      referralOrg: "Basics of Sikhi",
      guardianEmail: "parent@example.com",
      ...over,
    },
  });
  return (await registrationsFor(event.slug))[0];
}

describe("confirming a selection", () => {
  it("creates the account, with the age band derived from date of birth", async () => {
    const reg = await applied();
    await confirmSelection(event, reg);

    const player = await playerByEmail("tegh@example.com");
    expect(player).not.toBeNull();
    expect(player!.displayName).toBe("Tegh");
    expect(player!.ageBand).toBe("U16");
    // Not collected since 2026-09-01 — see lib/selection.ts.
    expect(player!.gamertag).toBeNull();
    // Never granted by being selected.
    expect(player!.isModerator).toBe(false);
    expect(player!.eventVerified).toBe(false);
  });

  it("takes the guardian email from the application, not from anywhere else", async () => {
    const reg = await applied();
    await confirmSelection(event, reg);
    expect((await playerByEmail("tegh@example.com"))!.guardianEmail).toBe("parent@example.com");
  });

  it("does not attach a guardian to an adult", async () => {
    const reg = await applied({
      dob: "2006-01-01",
      email: "adult@example.com",
      guardianEmail: "someone@example.com",
    });
    await confirmSelection(event, reg);
    const p = await playerByEmail("adult@example.com");
    expect(p!.ageBand).toBe("16+");
    expect(p!.guardianEmail).toBeNull();
  });

  it("links the application to the account and issues a check-in token", async () => {
    const reg = await applied();
    const { playerId } = await confirmSelection(event, reg);

    const db = await getDb();
    const row = await db
      .prepare("SELECT player_id, check_in_token FROM registrations WHERE id = ?")
      .bind(reg.id)
      .first<{ player_id: string; check_in_token: string }>();
    expect(row!.player_id).toBe(playerId);
    // The credential exists only now, and is long.
    expect(row!.check_in_token.length).toBeGreaterThan(20);
  });

  it("emails the offer", async () => {
    const reg = await applied();
    await confirmSelection(event, reg);
    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM email_sends WHERE kind = 'application-selected'")
      .first<{ to_email: string; status: string }>();
    expect(row!.to_email).toBe("tegh@example.com");
    expect(row!.status).toBe("sent");
  });

  it("is safe to run twice — no second account, no second email", async () => {
    // The draw can be re-run to backfill drop-outs, so this path gets repeated.
    const reg = await applied();
    await confirmSelection(event, reg);
    const after = (await registrationsFor(event.slug))[0];
    await confirmSelection(event, after);

    const db = await getDb();
    const players = await db.prepare("SELECT COUNT(*) AS n FROM players").first<{ n: number }>();
    const emails = await db
      .prepare("SELECT COUNT(*) AS n FROM email_sends WHERE kind = 'application-selected'")
      .first<{ n: number }>();
    expect(players!.n).toBe(1);
    expect(emails!.n).toBe(1);
  });

  it("keeps the check-in token stable across a re-run", async () => {
    const reg = await applied();
    await confirmSelection(event, reg);
    const db = await getDb();
    const first = await db
      .prepare("SELECT check_in_token AS t FROM registrations WHERE id = ?")
      .bind(reg.id).first<{ t: string }>();

    await confirmSelection(event, (await registrationsFor(event.slug))[0]);
    const second = await db
      .prepare("SELECT check_in_token AS t FROM registrations WHERE id = ?")
      .bind(reg.id).first<{ t: string }>();
    // Otherwise a re-run would invalidate a QR code already sent to someone.
    expect(second!.t).toBe(first!.t);
  });
});

describe("telling someone they were not selected", () => {
  it("emails them and creates NO account", async () => {
    const reg = await applied();
    await notifyNotSelected(event, reg);

    expect(await playerByEmail("tegh@example.com")).toBeNull();
    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM email_sends WHERE kind = 'application-not-selected'")
      .first<{ to_email: string }>();
    expect(row!.to_email).toBe("tegh@example.com");
  });

  it("explains it was a draw rather than a judgement", async () => {
    // The wording matters: this goes to a young person who did not get in.
    const { applicationOutcome } = await import("./email-templates");
    const t = applicationOutcome({
      selected: false,
      displayName: "Tegh",
      eventTitle: event.title,
      eventDate: event.date,
      reference: "SWC-AAA-BBB",
    });
    expect(t.text).toMatch(/draw/i);
    expect(t.text).toMatch(/not a judgement/i);
  });
});
