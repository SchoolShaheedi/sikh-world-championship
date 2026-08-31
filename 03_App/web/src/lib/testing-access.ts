/**
 * Tester access: real registration, one browser at a time.
 *
 * WHY THIS EXISTS
 * Everything after the form — the D1 write, the guardian email, the magic link, the draw,
 * the check-in token — can only be tested by submitting a real registration through the
 * deployed site. `SWC_REGISTRATION_DEMO` deliberately skips the write, so it cannot
 * exercise any of that. Opening `SWC_REGISTRATION_OPEN` in production exercises all of it
 * and simultaneously invites the public to enter children into an event whose date, venue
 * and DBS checks are not settled.
 *
 * So: a key, held in a cookie. The form is live for the browser that has it and closed to
 * everyone else, on the same deployment, with no separate environment to keep in sync.
 *
 * THE COOKIE HOLDS THE KEY ITSELF, not a flag. A cookie saying `tester=1` is a password
 * anyone can type. Compared in constant time, because a length-or-prefix leak on a
 * comparison is how a key gets guessed a character at a time.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { registrationOpen, registrationTestKey } from "./features";

export const TESTER_COOKIE = "swc_tester";

/** Eight hours: long enough for a rehearsal, short enough that it is not left lying open. */
export const TESTER_COOKIE_MAX_AGE = 8 * 60 * 60;

/**
 * Constant-time equality. Exported because it is the whole security of this mechanism and
 * deserves a test of its own.
 */
export function keyMatches(supplied: unknown, key: string | null): boolean {
  if (!key || typeof supplied !== "string" || supplied.length === 0) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(key);
  // timingSafeEqual throws on a length mismatch, which would itself leak the length.
  // Hashing first makes both sides fixed-width, so the comparison is the only signal.
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Is this request from a browser holding the test key? */
export async function isTester(): Promise<boolean> {
  const key = registrationTestKey();
  if (!key) return false;
  const jar = await cookies();
  return keyMatches(jar.get(TESTER_COOKIE)?.value, key);
}

/**
 * Is registration actually live for THIS request?
 *
 * The one function every gate should ask. `registrationOpen()` alone is now the wrong
 * question — it answers "is it open to the public", which is not the same thing, and a
 * page that asks the wrong one shows a closed notice above a working form.
 */
export async function registrationLive(): Promise<boolean> {
  return registrationOpen() || (await isTester());
}
