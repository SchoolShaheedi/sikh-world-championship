/**
 * Which player-facing features are switched on.
 *
 * Two independent reasons a feature can be off, and both currently apply to registration
 * and the Looking For Game board:
 *
 *  1. TECHNICAL. Both need a writable store. The stores are JSON files on disk, and
 *     Cloudflare Workers has no writable filesystem — `fs.mkdir` throws
 *     "operation not permitted". Left on, every submission would be a 500 with no
 *     explanation. See 00_Docs/DEPLOYMENT.md.
 *  2. SAFEGUARDING. 04_Legal/DPIA.md concludes that real registrations must not open:
 *     guardian notification emails do not send, children's data is not stored securely,
 *     nothing is ever deleted, and DBS checks have not started.
 *
 * The second reason outlives the first. Fixing the database does NOT make it correct to
 * switch registration on — that is a safeguarding decision, taken deliberately, and the
 * flag is where it gets recorded.
 *
 * Default OFF in production and ON in development, so local work is unaffected and a
 * deploy is safe by default. Turning something on in production takes an explicit
 * environment variable, which is a deliberate act someone has to justify.
 */

function flag(name: string): boolean {
  const value = process.env[name];
  if (value === "true") return true;
  if (value === "false") return false;
  // Unset: on locally, off anywhere that calls itself production.
  return process.env.NODE_ENV !== "production";
}

/** Can anyone actually enter an event? */
export function registrationOpen(): boolean {
  return flag("SWC_REGISTRATION_OPEN");
}

/** Is the Looking For Game board live? */
export function boardOpen(): boolean {
  return flag("SWC_BOARD_OPEN");
}
