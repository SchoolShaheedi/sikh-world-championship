import path from "node:path";

/**
 * Where the development JSON stores live.
 *
 * Overridable via SWC_DATA_DIR so tests can run against a temp directory instead of the
 * real one. Without this, running the test suite would wipe local data — and a test
 * suite people are afraid to run is a test suite nobody runs.
 */
export function dataDir(): string {
  return process.env.SWC_DATA_DIR ?? path.join(process.cwd(), ".data");
}
