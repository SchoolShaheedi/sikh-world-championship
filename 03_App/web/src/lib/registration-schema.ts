/**
 * Server-side validation for event registration.
 *
 * This replaces the four `if (!body[required])` checks the endpoint used to do. Those
 * checks left two holes that a request made outside the form walked straight through:
 *
 *  1. ANY extra key in the JSON body was persisted into `answers`, in the same record as
 *     a child's medical notes. Unbounded, unvalidated, and permanent.
 *  2. A 10-year-old could be confirmed with NO guardian details at all — no name, no
 *     email, no consent. The browser form asks for them; nothing on the server insisted.
 *     Everything downstream assumes that guardian email exists: `session.ts` takes it
 *     from the registration, and the whole board-consent flow is built on it. A minor
 *     registered without it is a child at a physical event with no consenting adult on
 *     record.
 *
 * The schema is built per event so an event's own `formFields` are validated too — a
 * select only accepts its listed options, and a new event needs no change here.
 *
 * Unknown keys are rejected rather than stripped. Every key we accept is one the form
 * puts there, so an unexpected one means the request did not come from our form, and
 * that is worth failing loudly instead of quietly dropping.
 */
import { z } from "zod";
import type { ChampionshipEvent, Division, FormField } from "./types";
import { AVATARS } from "@/data/avatars";
import {
  guardianTier,
  GUARDIAN_DISTANCE,
  MEDICAL_CONDITIONS,
  type GuardianTier,
} from "./guardian-rules";

/** Age on the day of the event, or today if the date isn't confirmed yet. */
export function ageOnEventDay(dob: string, eventDate: string | null): number | null {
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const ref = eventDate ? new Date(eventDate) : new Date();
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Trimmed, length-capped text. Caps exist so one request cannot bloat the store.
 *
 * `message` overrides zod's default, which reads "Invalid input: expected string,
 * received undefined". These strings are shown to a registrant or a parent, so anything
 * a person will read gets a sentence written for it.
 */
const text = (max: number, message?: string) =>
  z
    .string({ message: message ?? "This is required" })
    .trim()
    .min(1, message ?? "This is required")
    .max(max);

/**
 * An optional field the user left alone.
 *
 * The browser form holds every field in one state object and submits `""` for anything
 * untouched, so a bare `.optional()` would reject an empty box as "too short" — which
 * broke the real form the first time this schema went in. Treat `""` as absent.
 */
function optional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema.optional(),
  );
}

/**
 * Free-text notes a registrant writes about themselves. Capped, and deliberately
 * separate from `text` so the limit for prose is easy to find and change.
 */
const notes = (max = 1000) => z.string().trim().max(max);

/**
 * UK-oriented but permissive: digits, spaces and the usual punctuation, 9–20 chars.
 * Deliberately not a strict UK regex — a volunteer needs to phone this number, and
 * rejecting a valid international number is worse than accepting an odd format.
 */
const phone = z
  .string({ message: "We need a phone number" })
  .trim()
  .min(9, "That doesn't look like a phone number")
  .max(20)
  .regex(/^[0-9+()\s-]+$/, "Use digits, spaces, + and - only");

/**
 * Normalised then checked. `.email()` on a string is deprecated in zod 4, so the check
 * goes through `z.email()` — and trim/lowercase run first, so "  Foo@Bar.COM " is stored
 * as one canonical value rather than a near-duplicate of an existing registration.
 */
const email = z
  .string({ message: "We need an email address" })
  .trim()
  .toLowerCase()
  .max(254)
  .refine((v) => z.email().safeParse(v).success, "Check the email address");

/** A real calendar date, not in the future, and not implausibly long ago. */
const dateOfBirth = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Not a real date")
  .refine((v) => new Date(`${v}T00:00:00Z`) <= new Date(), "Date of birth is in the future")
  .refine(
    (v) => new Date(`${v}T00:00:00Z`) >= new Date("1900-01-01T00:00:00Z"),
    "Check the year of birth",
  );

/**
 * Checkbox consents. An HTML checkbox submits "on" when ticked and nothing when not, and
 * the form's own state sends a real boolean — so accept both, and treat absence as false.
 */
/**
 * A consent that must be truthfully given.
 *
 * Takes `unknown` and coerces, rather than a union of the accepted shapes. A union
 * rejects `undefined` before any `.refine()` runs, so an unticked box produced the
 * message "Invalid input" instead of the sentence written for it — and these messages go
 * straight in front of a parent. Coercing first means the written message always wins.
 */
const requiredConsent = (message: string) =>
  z
    .unknown()
    .transform((v) => v === true || v === "on" || v === "true")
    .refine((v) => v === true, message);

const optionalConsent = z
  .union([z.boolean(), z.literal("on"), z.literal("true"), z.literal(""), z.undefined()])
  .transform((v) => v === true || v === "on" || v === "true")
  .optional()
  .default(false);

/** One event-specific field from `event.formFields`, as its declared type. */
function fieldSchema(f: FormField): z.ZodTypeAny {
  switch (f.type) {
    case "select": {
      const options = f.options ?? [];
      // An empty options list would make z.enum throw at build time. Fall back to text
      // rather than crashing the endpoint on a malformed event definition.
      if (options.length === 0) return text(200);
      return z.enum(options as [string, ...string[]]);
    }
    case "checkbox":
      return optionalConsent;
    case "email":
      return email;
    case "tel":
      return phone;
    case "date":
      return dateOfBirth;
    case "textarea":
      return notes(1000);
    case "text":
    default:
      return text(200);
  }
}

/**
 * Build the validator for one event and division.
 *
 * `age` decides whether the guardian block is required, so it is computed from the
 * submitted date of birth before this runs — see `validateRegistration`.
 */
/**
 * The guardian block, shaped by the registrant's age tier.
 *
 * Every under-18 gives the same four contact fields and the same entry consent. What
 * changes by tier is the supervision promise — see guardian-rules.ts for why the rule is
 * tiered rather than blanket.
 */
function guardianSchema(tier: GuardianTier) {
  if (tier === "none") {
    /**
     * Round 25: every participant has an emergency contact on record.
     *
     * For an adult that is these three fields, required. For an under-18 it is the
     * guardian block below, which is already required and already holds a name, a
     * relationship and a phone number — so a minor is NOT asked twice. Duplicating a
     * child's guardian into a second set of fields would mean holding the same personal
     * data in two places for no gain, and every field held has to be justified,
     * protected and deleted on request.
     */
    return z.object({
      emergencyName: text(120, "Give us a name we can call in an emergency"),
      emergencyRelation: text(60, "How do you know them? Partner, brother, friend…"),
      emergencyPhone: phone,
      guardianName: optional(text(120)),
      guardianRelation: optional(text(60)),
      guardianEmail: optional(email),
      guardianMobile: optional(phone),
      guardianConsent: optionalConsent,
      guardianOnSite: optionalConsent,
      guardianDropOff: optionalConsent,
      guardianIndependentConsent: optionalConsent,
      mayLeaveUnaccompanied: optionalConsent,
      guardianDistance: optional(z.enum(GUARDIAN_DISTANCE)),
      guardianPhotoConsent: optionalConsent,
    });
  }

  const contact = {
    // Not asked of an under-18 — the guardian below IS their emergency contact.
    emergencyName: optional(text(120)),
    emergencyRelation: optional(text(60)),
    emergencyPhone: optional(phone),
    guardianName: text(120, "We need the parent or guardian's name"),
    guardianRelation: text(60, "Are you their mother, father, carer…?"),
    guardianEmail: email,
    guardianMobile: phone,
    // Without this there is no permission to hold their data or have them attend.
    guardianConsent: requiredConsent(
      "A parent or guardian must give permission for an under-18 to enter",
    ),
    /**
     * Photo consent is the guardian's to give, separately from entry consent — a child
     * cannot agree to their own image being used. Genuinely optional either way:
     * decision 18 made the player photo optional for exactly this reason, so refusing
     * must never block entry.
     */
    guardianPhotoConsent: optionalConsent,
  };

  const required = requiredConsent;

  switch (tier) {
    case "on-site":
      return z.object({
        ...contact,
        guardianOnSite: required(
          "For a player under 12, a parent or guardian must stay at the venue",
        ),
        // Not asked at this tier — a guardian who is present does the collecting.
        guardianDropOff: optionalConsent,
        guardianIndependentConsent: optionalConsent,
        mayLeaveUnaccompanied: optionalConsent,
        guardianDistance: optional(z.enum(GUARDIAN_DISTANCE)),
      });

    case "drop-off":
      return z.object({
        ...contact,
        guardianDropOff: required(
          "For a player aged 12 to 15, a parent or guardian must drop off and collect",
        ),
        // Defaults to false, and the form does not offer it at this tier: a 12–15 may not
        // leave on their own. Stated explicitly rather than left absent so the record
        // shows the answer was "no", not "never asked".
        mayLeaveUnaccompanied: optionalConsent,
        guardianDistance: z.enum(GUARDIAN_DISTANCE, {
          message: "Choose how far away you'll be during the event",
        }),
        guardianOnSite: optionalConsent,
        guardianIndependentConsent: optionalConsent,
      });

    case "independent":
      return z.object({
        ...contact,
        guardianIndependentConsent: required(
          "A parent or guardian must consent to a 16 or 17-year-old attending on their own",
        ),
        // The one tier where leaving alone is a real choice the guardian makes.
        mayLeaveUnaccompanied: optionalConsent,
        guardianOnSite: optionalConsent,
        guardianDropOff: optionalConsent,
        guardianDistance: optional(z.enum(GUARDIAN_DISTANCE)),
      });
  }
}

function schemaFor(event: ChampionshipEvent, division: Division, age: number) {
  const tier = guardianTier(age);
  const guardian = guardianSchema(tier);

  const core = z.object({
    divisionId: z.literal(division.id),
    fullName: text(100, "We need the player's full name"),
    dob: dateOfBirth,
    email,
    mobile: phone,
    region: optional(text(80)),

    /**
     * Chosen avatar. Validated against the real list rather than accepted as a string —
     * an unknown id would render a broken player card, and `getAvatar()` silently falls
     * back, so a bad value would never surface as an error anywhere else.
     */
    avatarId: optional(z.enum(AVATARS.map((a) => a.id) as [string, ...string[]])),

    /**
     * Medical tick-list plus free text for the detail. The list makes "None" an explicit
     * answer; the free-text box carries what a volunteer actually needs to act on.
     * These are the most sensitive fields in the app and are why the store needs
     * encryption at rest.
     */
    medicalConditions: z
      .array(z.enum(MEDICAL_CONDITIONS))
      .max(MEDICAL_CONDITIONS.length)
      .optional(),
    medical: optional(notes(1000)),
    dietary: optional(notes(500)),
    accessibility: optional(notes(500)),

    // Agreeing to the rules and to holding an account are both required of everyone.
    rulesAgreed: requiredConsent(
      "You need to agree to the rules and code of conduct",
    ),
    accountConsent: requiredConsent(
      "You need to agree to an SWC profile being created",
    ),
    // Genuinely optional — decision 18 made the photo optional on purpose.
    photoConsent: optionalConsent,
  });

  const custom: Record<string, z.ZodTypeAny> = {};
  for (const f of event.formFields) {
    // A minorsOnly field is only required when it actually applies.
    const s = fieldSchema(f);
    custom[f.name] = f.required && (!f.minorsOnly || age < 18) ? s : optional(s);
  }

  // .extend rather than the deprecated .merge — same result in zod 4.
  return core.extend(guardian.shape).extend(custom).strict();
}

/**
 * `answers` matches `Registration.answers`: every field in the schema resolves to a
 * string or a boolean, so the stored record needs no further narrowing.
 */
export type ValidationResult =
  | { ok: true; answers: Record<string, string | boolean | string[]>; age: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Validate a registration body against the event, the division and the registrant's age.
 *
 * Age is re-derived here from the submitted date of birth, never taken from the client.
 * The form's age gate is a courtesy to the person filling it in; this is the one that
 * holds.
 */
export function validateRegistration(
  event: ChampionshipEvent,
  division: Division,
  body: unknown,
): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Expected a registration object" };
  }

  const rawDob = (body as Record<string, unknown>).dob;
  if (typeof rawDob !== "string") {
    return { ok: false, error: "Missing date of birth", fieldErrors: { dob: "Required" } };
  }

  const age = ageOnEventDay(rawDob, event.date);
  if (age === null) {
    return { ok: false, error: "Invalid date of birth", fieldErrors: { dob: "Not a real date" } };
  }
  // Checked before the division gate: a mistyped year like 2030 produces a negative age,
  // and "this event is for ages 8 and over" is a baffling thing to tell that person.
  if (age < 0) {
    return {
      ok: false,
      error: "That date of birth is in the future — check the year.",
      fieldErrors: { dob: "Date of birth is in the future" },
    };
  }

  // The division gate runs before the rest of the schema so an ineligible entrant gets
  // the age message rather than a list of unrelated field errors.
  if (age < division.minAge || age > division.maxAge) {
    return {
      ok: false,
      error: `This event is for ages ${division.minAge}${
        division.maxAge === 99 ? " and over" : `–${division.maxAge}`
      }.`,
    };
  }

  const parsed = schemaFor(event, division, age).safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      // Keep the first error per field — a list of five messages for one input is noise.
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    const unexpected = parsed.error.issues.find((i) => i.code === "unrecognized_keys");
    return {
      ok: false,
      error: unexpected
        ? "That submission contained fields we don't recognise."
        : "Some details need checking.",
      fieldErrors,
    };
  }

  return {
    ok: true,
    answers: parsed.data as Record<string, string | boolean | string[]>,
    age,
  };
}
