/**
 * Volunteering — the roles, the three questions that decide anything, and the record.
 *
 * WHY THIS IS A TYPED MODULE AND NOT `en.json`. Same reason as `support-types.ts`: a role
 * here is a permitted value as well as a label. The form offers these ids, the server
 * accepts only these ids, and the stored row holds an id rather than a sentence — so
 * rewording "Check-in desk" tomorrow does not rewrite what somebody signed up for. Copy
 * that feeds validation stays in a `as const` tuple where the union survives.
 *
 * WHAT THE FORM ASKS AND WHY EACH ONE IS THERE. Everything on it earns its place by
 * changing a decision; nothing is collected because it might be interesting later.
 *
 *   roles         which jobs to consider them for
 *   availability  fifteen people are needed at 09:30 and a different fifteen at 15:00
 *   dbs           whether a check has to be arranged, and how long that takes
 *   referee       somebody who will vouch for them, because every job here is near children
 *   mobile        the only contact route that works on the day itself
 *
 * WHAT IT DOES NOT ASK, ON PURPOSE:
 *
 *   - a DBS certificate number, its date, or anything a check found. Three words is all
 *     the decision needs. See migrations/0015.
 *   - a date of birth. `over18` is a yes/no declaration; an exact age decides nothing here.
 *   - free text of any kind. Invariant 1 keeps free text to the support form and a
 *     report's detail, both of which go to moderators only, and a volunteer with something
 *     to add already has that route — it is linked from the page.
 */

export interface VolunteerRole {
  id: string;
  name: string;
  /** Shown after an em dash on the page. Empty when the name says it all. */
  detail: string;
  /** True where the role cannot be done without an enhanced check. */
  dbsRequired?: boolean;
}

export const VOLUNTEER_ROLES = [
  {
    id: "desk",
    name: "Check-in desk",
    detail: "handing out slips, scanning them in, checking dates of birth",
  },
  {
    id: "referee",
    name: "Referees",
    detail: "one per few stations, settling disputes, starting matches",
  },
  {
    id: "scores",
    name: "Score entry",
    detail: "keeping the live bracket up to date (one dedicated person)",
  },
  {
    id: "setup",
    name: "Setup and pack-down",
    detail: "consoles, screens, cabling, tables",
  },
  { id: "langar", name: "Langar and refreshments", detail: "" },
  { id: "photography", name: "Photography and social", detail: "" },
  {
    id: "safeguarding",
    name: "Safeguarding leads",
    detail: "the person a concern goes to, and the person who decides about proof of age",
    dbsRequired: true,
  },
] as const satisfies readonly VolunteerRole[];

export type VolunteerRoleId = (typeof VOLUNTEER_ROLES)[number]["id"];

export const VOLUNTEER_AVAILABILITY = [
  { id: "all-day", label: "The whole day", help: "09:30 to 16:30, including pack-down" },
  { id: "morning", label: "Morning only", help: "setup, the doors opening, the early rounds" },
  { id: "afternoon", label: "Afternoon only", help: "the later rounds, the final, pack-down" },
] as const;

export type VolunteerAvailability = (typeof VOLUNTEER_AVAILABILITY)[number]["id"];

/**
 * Three answers, and no fourth.
 *
 * "Not sure" exists because it is the true answer for most people — a DBS from a previous
 * job, a school, or a gurdwara may or may not still count, and a form that forces a guess
 * gets a wrong yes. A wrong yes is the only one of the three answers that is dangerous.
 */
export const VOLUNTEER_DBS = [
  { id: "yes", label: "Yes, I have a current enhanced DBS certificate" },
  { id: "no", label: "No" },
  { id: "not-sure", label: "Not sure — I have had one, but I do not know if it still counts" },
] as const;

export type VolunteerDbs = (typeof VOLUNTEER_DBS)[number]["id"];

export type VolunteerStatus = "new" | "accepted" | "declined";

export interface Volunteer {
  id: string;
  reference: string;
  eventSlug: string;
  fullName: string;
  email: string;
  mobile: string;
  roles: VolunteerRoleId[];
  availability: VolunteerAvailability;
  dbs: VolunteerDbs;
  /** Declared, not verified. The form states the rule; this records the answer. */
  over18: boolean;
  /** A third party who has not visited this site — see migrations/0015. */
  refereeName: string;
  refereeRelation: string;
  refereeContact: string;
  status: VolunteerStatus;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

export function roleById(id: string): VolunteerRole | undefined {
  return VOLUNTEER_ROLES.find((r) => r.id === id);
}

/** Ids → names, for a list a person reads. Unknown ids are dropped, never rendered raw. */
export function roleNames(ids: readonly string[]): string[] {
  return ids.map((id) => roleById(id)?.name).filter((n): n is string => Boolean(n));
}

export function availabilityLabel(id: string): string {
  return VOLUNTEER_AVAILABILITY.find((a) => a.id === id)?.label ?? id;
}

export function dbsLabel(id: string): string {
  return VOLUNTEER_DBS.find((d) => d.id === id)?.label ?? id;
}
