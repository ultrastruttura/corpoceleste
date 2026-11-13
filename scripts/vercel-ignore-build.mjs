/**
 * Vercel "Ignored Build Step" (Project → Settings → Git → Ignored Build Step):
 *   node scripts/vercel-ignore-build.mjs
 *
 * Exit 0 = skip build · Exit 1 = continue build (Vercel convention).
 *
 * Skips deploys that cannot affect the Vercel API (docs/CI-only), so production
 * API redeploys track shop/server changes. GitHub branch protection still
 * requires green CI before merge to main.
 */
import { execFileSync } from "node:child_process";

function changedFiles() {
  try {
    const out = execFileSync(
      "git",
      ["diff", "--name-only", `${process.env.VERCEL_GIT_PREVIOUS_SHA || "HEAD^"}...HEAD`],
      { encoding: "utf8" },
    );
    return out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    // First deploy / shallow clone — build.
    return null;
  }
}

const files = changedFiles();
if (!files) {
  console.log("No diff available — build");
  process.exit(1);
}

const affectsApi = files.some((f) => {
  if (f.startsWith("api/")) return true;
  if (f.startsWith("server/")) return true;
  if (f === "vercel.json" || f === "package.json" || f === "package-lock.json") return true;
  if (f.startsWith("src/data/") || f.startsWith("src/lib/") || f.startsWith("src/scripts/"))
    return true;
  if (f.startsWith("content/products/") || f.startsWith("content/settings/")) return true;
  return false;
});

if (!affectsApi) {
  console.log("Skip Vercel build — no API/shop server paths in diff:");
  for (const f of files) console.log(`  ${f}`);
  process.exit(0);
}

console.log("Continue Vercel build — API-related changes detected");
process.exit(1);
