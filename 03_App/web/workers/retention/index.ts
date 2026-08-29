/**
 * Retention cron worker.
 *
 * Deliberately a SEPARATE worker from the website.
 *
 * This job deletes children's medical data. Keeping it apart from the site means it can be
 * deployed, rolled back and reasoned about on its own; a mistake here cannot take the
 * website down, and a bad website deploy cannot silently stop the deletions. It also keeps
 * it independent of OpenNext's generated worker, which would otherwise have to be wrapped
 * to add a `scheduled` handler.
 *
 * It shares the actual logic with the app — `applyRetention` and the stores are the same
 * code the site uses — so the two cannot drift.
 */
import type { D1Database, ScheduledController, ExecutionContext } from "@cloudflare/workers-types";
import { setDb, type Db } from "../../src/lib/db";
import { applyRetention } from "../../src/lib/retention";

interface Env {
  swc_production: D1Database;
}

const worker = {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx: ExecutionContext,
  ): Promise<void> {
    // A plain cron worker has no OpenNext request context, so hand the binding over.
    setDb(env.swc_production as unknown as Db);

    const report = await applyRetention();

    // Logged rather than thrown on: the durable record is in `retention_runs`. These lines
    // are for watching a run in `wrangler tail`.
    for (const a of report.actions) {
      console.info(
        `[retention] ${a.eventSlug} ${a.action} rows=${a.rowsAffected} — ${a.note}`,
      );
    }
    for (const s of report.skipped) {
      console.warn(`[retention] SKIPPED ${s.eventSlug} — ${s.reason}`);
    }
    if (report.actions.length === 0 && report.skipped.length === 0) {
      console.info("[retention] nothing due");
    }
  },
};

export default worker;
