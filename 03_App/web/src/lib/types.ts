/**
 * Sikh World Championships — core domain types.
 *
 * Design rule: an EVENT IS DATA, NOT CODE. Adding "Sikh Chess Championship 2027"
 * must be one new file in src/data/events/ and nothing else. Every type here is
 * therefore sport-agnostic; anything FIFA-specific lives in the event's own
 * `formFields` and `rules`.
 */

export type AgeBand = "U16" | "16+";

/** Which sport/game an event is for. Extend freely — this is just a label + icon key. */
export type Discipline =
  | "fifa"
  | "chess"
  | "kabaddi"
  | "gatka"
  | "quiz"
  | "athletics"
  | "other";

export type EventStatus =
  | "draft"          // not public yet
  | "announced"      // page live, sign-ups not open
  | "signups-open"
  | "signups-full"   // capacity reached, waitlist still collecting
  | "in-progress"    // happening today
  | "complete";

export type EventFormat =
  | "groups-then-knockout"
  | "single-elimination"
  | "double-elimination"
  | "round-robin"
  | "non-competitive";

/**
 * A division is a separate bracket within an event, with its own champion.
 * Sikh FC 27 runs a single open division — everyone in one bracket, one champion.
 *
 * The type still supports several, because future events may want age or weight
 * categories (kabaddi almost certainly will), and splitting later should be data, not
 * a rewrite.
 *
 * NOTE: a division's age bounds are a TOURNAMENT concept and have nothing to do with the
 * `AgeBand` used by the Find a game board. That one is a safeguarding boundary keeping
 * under-16s and adults apart online, and it is not affected by how an event is divided.
 */
export interface Division {
  id: string;
  name: string;
  /** Inclusive age bounds on the day of the event. */
  minAge: number;
  maxAge: number;
  capacity: number;
}

/**
 * Custom sign-up questions. This is what makes the platform multi-event:
 * FIFA asks for a PSN ID, chess asks for an ECF rating, kabaddi asks for a
 * playing position. Same form engine, different questions, no code change.
 */
export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "select"
  | "checkbox"
  | "textarea";

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  /** Shown under the field in small text. */
  help?: string;
  placeholder?: string;
  /** For type: "select". */
  options?: string[];
  /** Only show this field if the registrant is under 18. */
  minorsOnly?: boolean;
}

export interface Venue {
  name: string;
  addressLines: string[];
  postcode: string;
  /** Optional maps link. */
  mapsUrl?: string;
}

export interface AwardTier {
  id: string;
  label: string;
  /** Drives the size/metal of the trophy rendered in the cabinet. */
  tier: "gold" | "silver" | "bronze" | "participant" | "special";
}

export interface ChampionshipEvent {
  slug: string;
  title: string;
  shortTitle: string;
  discipline: Discipline;
  status: EventStatus;
  format: EventFormat;

  /** One-line hook used on cards and previews. */
  tagline: string;
  /** Markdown-ish body for the event page. */
  description: string;

  /** ISO date string, or null while unconfirmed. */
  date: string | null;
  /** Human-readable, e.g. "09:30 – 16:30". Null while unconfirmed. */
  times: string | null;
  venue: Venue | null;

  /** Total across all divisions. */
  capacity: number;
  divisions: Division[];

  entryFee: number; // 0 = free
  currency: "GBP";

  rules: string[];
  prizes: string[];
  awardTiers: AwardTier[];

  /** Extra sign-up questions beyond the standard player + guardian fields. */
  formFields: FormField[];

  /** Set false while details are still TBC — the page shows a notice. */
  detailsConfirmed: boolean;
  /**
   * When applications close and the draw runs. ISO date, or null while undecided.
   * Separate from `date` because the two move independently — the draw needs to leave
   * time to notify people and backfill drop-outs.
   */
  applicationsCloseAt: string | null;
}

/* ---------- People & registrations ---------- */

export interface PlayerProfile {
  id: string;
  displayName: string;
  /** Never the exact age publicly — only the band. */
  ageBand: AgeBand;
  /** Region only. Never a postcode or full address. */
  region: string;
  /** Avatar id from src/data/avatars.ts, or an uploaded photo URL. */
  avatarId: string | null;
  photoUrl: string | null;
  gamertags: { platform: string; handle: string }[];
  joinedAt: string;
}

/**
 * An application's life. Filling in the form does not secure a place — see
 * migrations/0005_applications.sql.
 *
 * There is deliberately no "waitlisted": a queue position also revealed how many people
 * had applied, and both the concept and the leak went together.
 */
export type RegistrationStatus =
  | "applied"
  | "selected"
  | "not-selected"
  | "withdrawn"
  | "checked-in"
  | "no-show";

export interface Registration {
  id: string;
  eventSlug: string;
  divisionId: string;
  playerId: string;
  status: RegistrationStatus;
  /** Position in the waitlist queue; null when confirmed. */
  waitlistPosition: number | null;
  /** Short, human-readable, unique. Read aloud at the desk and quoted in support emails. */
  reference: string;
  /**
   * Credential encoded into the check-in QR code. Long and random, and deliberately not
   * the same value as `reference` — holding this is what marks a player present.
   */
  checkInToken: string;
  createdAt: string;
  /**
   * The validated sign-up answers. `string[]` is there for multi-select questions such
   * as the medical tick-list — see src/lib/registration-schema.ts, which is the only
   * thing allowed to produce this object.
   */
  answers: Record<string, string | boolean | string[]>;
}

/* ---------- Awards / trophy cabinet ---------- */

export interface AwardedTrophy {
  id: string;
  playerId: string;
  eventSlug: string;
  eventTitle: string;
  discipline: Discipline;
  divisionName: string;
  tierId: string;
  label: string;
  tier: AwardTier["tier"];
  awardedAt: string;
}
