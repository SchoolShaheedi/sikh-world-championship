import en from "./en.json";

/**
 * EVERY PIECE OF PUBLIC-SITE PROSE THAT HAD NO OTHER HOME.
 *
 * WHY THIS EXISTS: checking the words on the site meant opening fifteen page files and
 * reading JSX, and changing a sentence meant finding which conditional branch it sat in.
 * `en.json` is one file, plain strings, editable without touching a component.
 *
 * WHAT IS DELIBERATELY *NOT* HERE. Copy that is already single-sourced elsewhere stays
 * there, because those files are typed and several of them feed validation:
 *
 *   src/data/org.ts               name, tagline, intro, socials
 *   src/data/events/<slug>.ts     title, description, rules, prizes, form questions
 *   src/data/profile-benefits.ts  what a profile gives you
 *   src/data/sponsors.ts          sponsors and their offers
 *   src/data/qualities.ts         the 32 Qualities
 *   src/data/id-check.ts          proof-of-age wording, shared with the emails and desk
 *   src/data/referral-orgs.ts     the referral list — also the draw's input
 *   src/data/avatars.ts           avatar labels
 *   src/lib/support-types.ts      support categories        (const tuple, feeds validation)
 *   src/lib/guardian-types.ts     GUARDIAN_TERMS
 *   src/lib/guardian-rules.ts     tier explanations, MEDICAL_CONDITIONS  (feeds validation)
 *   src/lib/play-types.ts         board options, report reasons          (const tuples)
 *   src/lib/registration-schema.ts  field-level validation messages
 *   src/lib/email-templates.ts    transactional email bodies
 *
 * Moving those into JSON would lose the `as const` unions the schema is built from — a
 * medical condition or a support category is not just a label, it is a permitted value.
 *
 * `scripts/copy-report.mjs` reads this file AND all of the above, and writes one page
 * listing every string in the site with an editable box next to it. Run it after any
 * copy change.
 */
export const copy = en;

/**
 * Substitute `{name}` placeholders.
 *
 * Unmatched placeholders are left in place rather than blanked, so a missing variable
 * shows up as `{capacity}` on the page — visible in a screenshot — instead of silently
 * rendering "all  places are decided by a random draw".
 */
export function fill(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? whole : String(v);
  });
}

export interface CopySegment {
  text: string;
  /** True for a run that was wrapped in `[[ ]]` in the source string. */
  em: boolean;
}

/**
 * Split a string on its `[[emphasis]]` markers.
 *
 * ONE MARKER, NOT A MARKUP LANGUAGE. Several sentences need a run of words picked out —
 * as a brighter span, a `<strong>`, or a link — and the alternative was splitting each
 * one into `before` / `middle` / `after` keys, which is three boxes to edit for one
 * sentence and no way to see the sentence whole. What the marked run *looks like* stays
 * a decision of the call site, which is where styling belongs; see `Rich`.
 */
export function segments(text: string): CopySegment[] {
  return text
    .split(/(\[\[.*?\]\])/g)
    .filter((part) => part !== "")
    .map((part) =>
      part.startsWith("[[") && part.endsWith("]]")
        ? { text: part.slice(2, -2), em: true }
        : { text: part, em: false },
    );
}
