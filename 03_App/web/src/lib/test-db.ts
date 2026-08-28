/**
 * A D1-shaped database backed by `node:sqlite`, for tests.
 *
 * D1 *is* SQLite, and the query surface the stores use is four methods wide, so a thin
 * adapter gets the real SQL exercised without booting workerd. Tests stay in-process and
 * the suite stays fast enough that people actually run it.
 *
 * Test-only. Never imported by application code — `getDb()` reaches for the real binding
 * unless a test has injected this.
 */
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Db, Stmt } from "./db";

/** node:sqlite returns null-prototype objects; tests compare against plain ones. */
function plain<T>(row: unknown): T {
  return { ...(row as Record<string, unknown>) } as T;
}

class SqliteStmt implements Stmt {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly values: unknown[] = [],
  ) {}

  bind(...values: unknown[]): Stmt {
    return new SqliteStmt(this.db, this.sql, values);
  }

  async all<T>(): Promise<{ results: T[] }> {
    const rows = this.db.prepare(this.sql).all(...(this.values as never[]));
    return { results: rows.map((r) => plain<T>(r)) };
  }

  async first<T>(): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.values as never[]));
    return row === undefined ? null : plain<T>(row);
  }

  async run(): Promise<unknown> {
    return this.db.prepare(this.sql).run(...(this.values as never[]));
  }
}

class SqliteDb implements Db {
  constructor(private readonly db: DatabaseSync) {}
  prepare(sql: string): Stmt {
    return new SqliteStmt(this.db, sql);
  }
  async batch(statements: Stmt[]): Promise<unknown> {
    // D1 batches in one transaction. Same guarantee here, which matters for the
    // waitlist: counting places and inserting must not interleave.
    this.db.exec("BEGIN");
    try {
      const out = [];
      for (const s of statements) out.push(await s.run());
      this.db.exec("COMMIT");
      return out;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  async exec(sql: string): Promise<unknown> {
    this.db.exec(sql);
    return undefined;
  }
  close(): void {
    this.db.close();
  }
}

/** Every migration, in filename order — the same ones D1 applies. */
function schema(): string {
  const dir = path.join(process.cwd(), "migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

/** A fresh in-memory database with the real schema applied. */
export function createTestDb(): Db & { close(): void } {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(schema());
  return new SqliteDb(db);
}
