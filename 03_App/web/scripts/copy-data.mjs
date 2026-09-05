/**
 * Pull the copy out of the typed data modules, for `copy-report.mjs`.
 *
 * WHY esbuild AND NOT A PARSER: these files are TypeScript with `as const` tuples and
 * path aliases, and every regex-based reader of them I could write would go stale the
 * first time somebody reformatted one. Bundling and evaluating them means the report
 * reads exactly what the app reads — if the app compiles, the report is right.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const ENTRY = `
import { ORG } from "@/data/org";
import { EVENTS } from "@/data/events";
import { PROFILE_BENEFITS } from "@/data/profile-benefits";
import { SPONSORS } from "@/data/sponsors";
import { QUALITIES } from "@/data/qualities";
import { AVATARS } from "@/data/avatars";
import { REFERRAL_ORGS, REFERRAL_NONE, REFERRAL_OTHER } from "@/data/referral-orgs";
import { SUPPORT_CATEGORIES } from "@/lib/support-types";
import { GUARDIAN_TERMS } from "@/lib/guardian-types";
import { TIER_EXPLANATION, MEDICAL_CONDITIONS } from "@/lib/guardian-rules";
import { GAMES, PLATFORMS, WINDOWS, INTENSITY, PRESET_NOTES, REPORT_REASONS } from "@/lib/play-types";
import { ID_REQUIREMENT, ID_PHOTO_ALLOWED, ID_WE_KEEP_NOTHING, ID_ACCEPTED, ID_NO_DOCUMENT_RULE } from "@/data/id-check";
import { VOLUNTEER_ROLES, VOLUNTEER_AVAILABILITY, VOLUNTEER_DBS } from "@/lib/volunteer-types";
export const DATA = {
  ORG, EVENTS, PROFILE_BENEFITS, SPONSORS, QUALITIES, AVATARS,
  REFERRAL_ORGS, REFERRAL_NONE, REFERRAL_OTHER,
  SUPPORT_CATEGORIES, GUARDIAN_TERMS, TIER_EXPLANATION, MEDICAL_CONDITIONS,
  GAMES, PLATFORMS, WINDOWS, INTENSITY, PRESET_NOTES, REPORT_REASONS,
  ID_REQUIREMENT, ID_PHOTO_ALLOWED, ID_WE_KEEP_NOTHING, ID_ACCEPTED, ID_NO_DOCUMENT_RULE,
  VOLUNTEER_ROLES, VOLUNTEER_AVAILABILITY, VOLUNTEER_DBS,
};
`;

export async function loadDataCopy() {
  const out = await build({
    stdin: { contents: ENTRY, resolveDir: SRC, loader: "ts" },
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    alias: { "@": SRC },
    logLevel: "silent",
  });
  const code = out.outputFiles[0].text;
  const mod = await import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
  return mod.DATA;
}
