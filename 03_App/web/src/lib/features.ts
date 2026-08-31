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

/**
 * Demo mode: render the sign-up form, validate it properly, and save nothing.
 *
 * For walking a planning team through the flow before entries open. Everything runs
 * except the write — the schema still rejects a missing guardian, still refuses unknown
 * fields, still enforces the age tiers — so what people see is the real form, not a mockup.
 *
 * It is labelled unmistakably on the page and again on the confirmation, because a form
 * that looks like it worked is exactly how someone ends up believing their child has a
 * place when no record exists. Ignored when registration is genuinely open.
 */
export function registrationDemo(): boolean {
  if (registrationOpen()) return false;
  return process.env.SWC_REGISTRATION_DEMO === "true";
}

/**
 * The key that opens real registration for ONE browser, without opening it to the public.
 *
 * The problem this solves: the only way to test the whole path — write to D1, guardian
 * email, magic link, the draw — is to submit a real registration through the deployed
 * site. Switching `SWC_REGISTRATION_OPEN` on to do that opens the form to everyone who
 * happens to visit, which for a form that asks a child for medical details is not a
 * five-minute risk worth taking. With a key, the door is open only to whoever has it.
 *
 * Set as a Cloudflare secret, never a var in wrangler.jsonc — that file is committed and
 * this repository is public:
 *
 *   npx wrangler secret put SWC_TEST_KEY
 *
 * Minimum 24 characters, enforced here rather than trusted. A short key is guessable, and
 * a typo like `SWC_TEST_KEY=true` would otherwise be a working password. Unset means the
 * feature does not exist — there is no default and no fallback.
 */
export function registrationTestKey(): string | null {
  const key = process.env.SWC_TEST_KEY;
  if (typeof key !== "string" || key.length < 24) return null;
  return key;
}

/** Is the Looking For Game board live? */
export function boardOpen(): boolean {
  return flag("SWC_BOARD_OPEN");
}

/**
 * Should invented preview data be rendered?
 *
 * OFF in production, unconditionally — there is no environment variable to turn it on,
 * because the failure mode is not a broken page but a convincing lie. The bracket's demo
 * entrants are thirty-two plausible Sikh names; on a public page they are indistinguishable
 * from a real draw, and the day of the event the hall would be watching a screen full of
 * people who do not exist. The demo trophy cabinet is the same problem in miniature.
 *
 * Deliberately NOT the `flag()` helper above: those can be overridden by an env var, and
 * this one must not be.
 */
export function showDemoData(): boolean {
  return process.env.NODE_ENV !== "production";
}
