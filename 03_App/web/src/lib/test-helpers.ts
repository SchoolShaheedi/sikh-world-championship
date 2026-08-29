/**
 * Point the stores at a throwaway database for each test file.
 *
 * Same contract as before the D1 migration — `useTempDataDir()` / `clearDataDir()` are
 * still the two calls, so no test file had to change. What they point at is now an
 * in-memory SQLite database with the real migrations applied, rather than a temp
 * directory of JSON files.
 *
 * The principle is unchanged and worth restating: tests must never touch real data. A
 * test suite people are afraid to run is a test suite nobody runs.
 */
import { setDb } from "./db";
import { createTestDb } from "./test-db";

let current: (ReturnType<typeof createTestDb>) | null = null;

/**
 * Swap in a brand-new database.
 *
 * Extracted so `clearDataDir` does not call `useTempDataDir` — eslint's rules-of-hooks
 * reads any `use`-prefixed call as a React hook, and the public name has to stay put
 * because every test file imports it.
 */
function freshDb(): void {
  current?.close();
  current = createTestDb();
  setDb(current);
}

export async function useTempDataDir(): Promise<string> {
  freshDb();
  return ":memory:";
}

/** Fresh database between tests, so one cannot leak state into the next. */
export async function clearDataDir(): Promise<void> {
  freshDb();
}
