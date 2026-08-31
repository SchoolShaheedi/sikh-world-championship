/**
 * `event_slug` is NOT NULL on `retention_runs`, and a dormant profile — or a manual
 * deletion — belongs to no event. This sentinel keeps the audit trail readable rather
 * than making the column nullable.
 *
 * Its own file so that `account-delete.ts` and `retention.ts` can both use it without
 * importing each other: retention.ts imports the deletion primitive, so the constant
 * cannot live there.
 */
export const PLATFORM_SCOPE = "(platform)";
