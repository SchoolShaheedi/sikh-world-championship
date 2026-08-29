/**
 * Database access — Cloudflare D1.
 *
 * Replaces the JSON files. See 00_Docs/DATA-LAYER.md and DECISIONS.md round 29 for why
 * D1 rather than Supabase.
 *
 * TWO BACKENDS, ONE INTERFACE. D1's query API (`prepare().bind().all()/first()/run()`) is
 * small, so tests run against `node:sqlite` instead of spinning up workerd. That keeps the
 * suite in-process and fast — the whole point of `test-helpers.ts` was that a test suite
 * people are afraid to run is one nobody runs, and a five-second workerd boot per file
 * would undo that. The SQL is identical either way, because SQLite is what D1 is.
 */
import type { D1Database } from "@cloudflare/workers-types";

/** The subset of D1 the stores actually use. */
export interface Db {
  prepare(sql: string): Stmt;
  batch(statements: Stmt[]): Promise<unknown>;
  exec(sql: string): Promise<unknown>;
}

export interface Stmt {
  bind(...values: unknown[]): Stmt;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

let override: Db | null = null;

/**
 * Supply the database directly, instead of resolving it from the Cloudflare request
 * context. Two callers:
 *
 *  - tests, which pass an in-process SQLite database (see test-helpers.ts)
 *  - the retention worker, which is a plain Cron worker with no OpenNext context, so it
 *    hands over `env.swc_production` itself
 *
 * Pass null to go back to resolving from the request context.
 */
export function setDb(db: Db | null): void {
  override = db;
}

/**
 * The D1 binding, from the Cloudflare request context.
 *
 * Imported lazily: `@opennextjs/cloudflare` pulls in Workers-only globals, and importing
 * it at module load breaks vitest, which runs in plain Node.
 */
async function cloudflareDb(): Promise<Db> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const env = (await getCloudflareContext({ async: true })).env as unknown as {
    swc_production?: D1Database;
  };
  if (!env.swc_production) {
    throw new Error(
      "No D1 binding. Expected `swc_production` — check d1_databases in wrangler.jsonc.",
    );
  }
  return env.swc_production as unknown as Db;
}

export async function getDb(): Promise<Db> {
  if (override) return override;
  return cloudflareDb();
}

/* ---------- helpers the stores share ---------- */

/** SQLite has no boolean type; it stores 0/1. */
export const bool = (v: unknown): number => (v ? 1 : 0);
export const fromBool = (v: unknown): boolean => v === 1 || v === true;

/** A JSON column, tolerant of a row written before the column existed. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
