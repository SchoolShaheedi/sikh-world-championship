import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Point the stores at a fresh temp directory for each test file, so tests never touch
 * real data and never leak state into each other.
 */
export async function useTempDataDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "swc-test-"));
  process.env.SWC_DATA_DIR = dir;
  return dir;
}

export async function clearDataDir(): Promise<void> {
  const dir = process.env.SWC_DATA_DIR;
  if (!dir) return;
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}
