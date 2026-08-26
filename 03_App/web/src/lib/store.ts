/**
 * Registration store — DEVELOPMENT IMPLEMENTATION.
 *
 * Backed by a JSON file so the whole sign-up flow works end to end today without any
 * accounts, keys or third-party setup. It is deliberately behind a narrow interface so
 * swapping in Supabase (or Sheets) later touches only this file.
 *
 * BEFORE THE EVENT GOES LIVE, replace with a real database:
 *   - a JSON file does not survive a redeploy on most hosts
 *   - it has no concurrency safety if two people submit at the same instant
 *   - it stores guardian contact details and medical notes, which need encryption
 *     at rest and access control
 * See 03_App/docs/DATA-LAYER.md.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir } from "./data-dir";
import type { Registration, RegistrationStatus } from "./types";

const FILE = () => path.join(dataDir(), "registrations.json");

async function readAll(): Promise<Registration[]> {
  try {
    return JSON.parse(await fs.readFile(FILE(), "utf8")) as Registration[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Registration[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(FILE(), JSON.stringify(rows, null, 2), "utf8");
}

export async function registrationsFor(eventSlug: string): Promise<Registration[]> {
  return (await readAll()).filter((r) => r.eventSlug === eventSlug);
}

/** Confirmed players in a division — the number that counts against capacity. */
export async function confirmedCount(
  eventSlug: string,
  divisionId: string,
): Promise<number> {
  const rows = await registrationsFor(eventSlug);
  return rows.filter(
    (r) =>
      r.divisionId === divisionId &&
      (r.status === "confirmed" || r.status === "checked-in"),
  ).length;
}

/**
 * Alphabet with the confusable characters removed — no 0/O, no 1/I/L.
 * References get read aloud at a check-in desk and typed by volunteers, so "was that
 * an O or a zero?" is a real cost.
 */
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomRef(): string {
  let out = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return `SWC-${out.slice(0, 3)}-${out.slice(3)}`;
}

/**
 * A short reference for humans, guaranteed unique against what's already stored.
 *
 * The previous version used 2 random bytes with no uniqueness check. That's 65,536
 * possibilities, which sounds like plenty but gives a ~2.6% chance of a duplicate within
 * a single 64-player event, rising as events accumulate. A test caught it.
 */
function makeReference(existing: Registration[]): string {
  const taken = new Set(existing.map((r) => r.reference));
  for (let attempt = 0; attempt < 50; attempt++) {
    const ref = randomRef();
    if (!taken.has(ref)) return ref;
  }
  // Astronomically unlikely; fall back to something that cannot collide.
  return `SWC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

/**
 * The check-in token is a CREDENTIAL, not a reference — it's what the QR code carries,
 * and holding it is what lets someone be marked present. It is therefore long and random,
 * and deliberately NOT the same value as the human-readable reference, which gets read
 * aloud, printed on lists, and quoted in emails.
 */
function makeCheckInToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export interface RegisterResult {
  status: Extract<RegistrationStatus, "confirmed" | "waitlisted">;
  reference: string;
  /** Goes in the QR code. Never printed on a public list. */
  checkInToken: string;
  waitlistPosition?: number;
}

/**
 * Register a player. Fills the division to capacity, then waitlists.
 * The waitlist matters: free events no-show at 20–30%, so places do open up.
 */
export async function register(input: {
  eventSlug: string;
  divisionId: string;
  divisionCapacity: number;
  playerId: string;
  answers: Record<string, string | boolean>;
}): Promise<RegisterResult> {
  const rows = await readAll();

  const taken = rows.filter(
    (r) =>
      r.eventSlug === input.eventSlug &&
      r.divisionId === input.divisionId &&
      (r.status === "confirmed" || r.status === "checked-in"),
  ).length;

  const waitlisted = rows.filter(
    (r) =>
      r.eventSlug === input.eventSlug &&
      r.divisionId === input.divisionId &&
      r.status === "waitlisted",
  ).length;

  const isFull = taken >= input.divisionCapacity;
  const reference = makeReference(rows);
  const checkInToken = makeCheckInToken();

  const row: Registration = {
    id: crypto.randomUUID(),
    eventSlug: input.eventSlug,
    divisionId: input.divisionId,
    playerId: input.playerId,
    status: isFull ? "waitlisted" : "confirmed",
    waitlistPosition: isFull ? waitlisted + 1 : null,
    reference,
    checkInToken,
    createdAt: new Date().toISOString(),
    answers: input.answers,
  };

  rows.push(row);
  await writeAll(rows);

  return isFull
    ? {
        status: "waitlisted",
        reference,
        checkInToken,
        waitlistPosition: waitlisted + 1,
      }
    : { status: "confirmed", reference, checkInToken };
}

/**
 * Promote the next person off the waitlist when someone withdraws.
 * Returns the promoted registration so the caller can email them.
 */
export async function promoteFromWaitlist(
  eventSlug: string,
  divisionId: string,
): Promise<Registration | null> {
  const rows = await readAll();
  const queue = rows
    .filter(
      (r) =>
        r.eventSlug === eventSlug &&
        r.divisionId === divisionId &&
        r.status === "waitlisted",
    )
    .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));

  const next = queue[0];
  if (!next) return null;

  next.status = "confirmed";
  next.waitlistPosition = null;
  for (const r of queue.slice(1)) {
    if (r.waitlistPosition) r.waitlistPosition -= 1;
  }

  await writeAll(rows);
  return next;
}

/** Mark a player present from their QR check-in token. */
export async function checkIn(token: string): Promise<Registration | null> {
  const rows = await readAll();
  const row = rows.find((r) => r.checkInToken === token);
  if (!row) return null;
  row.status = "checked-in";
  await writeAll(rows);
  return row;
}
