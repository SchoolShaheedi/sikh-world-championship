/**
 * The public tournament handle.
 *
 * ONE JOB: give the bracket, the projector and the player card a name to show that is
 * neither the entrant's real full name nor their PlayStation ID.
 *
 * Why this module exists at all, since it would be shorter to just print the first name:
 *
 *  * A PSN ID is a CONTACT ROUTE. Search it on PlayStation and you can send a friend
 *    request to a twelve-year-old. It is the one field released only to two players who
 *    have both agreed to a game (SAFEGUARDING-POLICY.md §5), so putting it on a screen in
 *    a hall would undo the strongest protection the platform has. It also frequently
 *    carries a real name or a birth year.
 *  * A real full name breaks the same policy's promise that a public profile shows a first
 *    name and never a surname.
 *
 * So the handle is a third string with no contact route attached, chosen by the player at
 * registration and defaulted to first name plus last initial. The two refusals below —
 * a handle equal to the PSN ID, and a handle containing the surname — are what stop the
 * field quietly becoming one of the two things it was created to avoid.
 *
 * It is deliberately NOT unique. Two players called Amrit S. is a scoreboard question,
 * not a safeguarding one, and enforcing uniqueness would push people towards
 * distinguishing themselves with a birth year.
 */

export const HANDLE_MIN = 2;
export const HANDLE_MAX = 16;

/**
 * Letters, digits, space, dot, hyphen, underscore.
 *
 * Everything else is out — not for injection safety (React escapes, and `esc()` handles
 * email) but because this string is read aloud by a compère and printed on a card, and
 * because the wider the charset the easier it is to smuggle in something that reads as an
 * insult or an address.
 */
const ALLOWED = /^[A-Za-z0-9 ._-]+$/;

/** Collapse whitespace and trim. Applied before every check, and before storage. */
export function normaliseHandle(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * First name plus last initial: "Amritpal Singh" -> "Amritpal S."
 *
 * The fallback for anyone who leaves the box empty, which most people will. A single-word
 * name is returned as it is rather than padded with a fake initial.
 *
 * Truncated to HANDLE_MAX from the FRONT of the first name, so a long name loses its tail
 * rather than its beginning — "Harjinderpa S." is recognisable, "…derpal S." is not.
 */
export function defaultHandle(fullName: string): string {
  const parts = normaliseHandle(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return "Player";
  const first = parts[0];
  if (parts.length === 1) return first.slice(0, HANDLE_MAX);
  const initial = `${parts[parts.length - 1][0].toUpperCase()}.`;
  const room = HANDLE_MAX - initial.length - 1;
  return `${first.slice(0, Math.max(1, room))} ${initial}`;
}

/** The surname we refuse to see in a handle, or null when there isn't one. */
function surnameOf(fullName: string): string | null {
  const parts = normaliseHandle(fullName).split(" ").filter(Boolean);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  // Two-letter surnames are not worth matching on: the false positives ("Fc", "Xi")
  // outnumber the real ones.
  return last.length >= 3 ? last : null;
}

export type HandleProblem =
  | { code: "length"; message: string }
  | { code: "charset"; message: string }
  | { code: "psn-id"; message: string }
  | { code: "surname"; message: string };

/**
 * Check a handle the player typed, in the context of the rest of their form.
 *
 * `psnId` and `fullName` are optional so the same function serves the browser (which has
 * them) and any caller that does not — but the server always passes both, because those
 * two comparisons are the entire point.
 */
export function checkHandle(
  raw: string,
  context: { fullName?: string; psnId?: string } = {},
): HandleProblem | null {
  const handle = normaliseHandle(raw);

  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) {
    return {
      code: "length",
      message: `Between ${HANDLE_MIN} and ${HANDLE_MAX} characters.`,
    };
  }
  if (!ALLOWED.test(handle)) {
    return {
      code: "charset",
      message: "Letters, numbers, spaces, full stops, hyphens and underscores only.",
    };
  }

  const psn = normaliseHandle(context.psnId ?? "");
  if (psn.length >= 3 && handle.toLowerCase() === psn.toLowerCase()) {
    return {
      code: "psn-id",
      message:
        "Please don't use your PSN ID here — this name goes on a screen everyone can see, " +
        "and anyone could then look you up on PlayStation. Pick something else.",
    };
  }

  const surname = surnameOf(context.fullName ?? "");
  if (surname) {
    // Word-boundary match, so "Singh" is caught in "Singh_FC" but "Sing" is not caught in
    // "Singer". Escaped because a surname can legitimately contain a hyphen.
    const escaped = surname.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
    if (new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, "i").test(handle)) {
      return {
        code: "surname",
        message:
          "Leave your surname out — public names on SWC are a first name or a nickname, " +
          "never a surname.",
      };
    }
  }

  return null;
}

/**
 * What actually gets stored: the player's handle if they gave a usable one, otherwise the
 * default derived from their name.
 *
 * Falls back silently rather than throwing. The server validates the typed handle and
 * rejects a bad one with a message before reaching here; this is the last line, and at
 * that point a name on the card beats a crash.
 */
export function resolveHandle(
  raw: unknown,
  fullName: string,
  psnId?: string,
): string {
  if (typeof raw === "string") {
    const handle = normaliseHandle(raw);
    if (handle && !checkHandle(handle, { fullName, psnId })) return handle;
  }
  return defaultHandle(fullName);
}
