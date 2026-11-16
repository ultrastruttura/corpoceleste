/**
 * Vercel "Ignored Build Step" (Project → Settings → Git → Ignored Build Step):
 *   node scripts/vercel-ignore-build.mjs
 *
 * Exit 0 = skip build · Exit 1 = continue build (Vercel convention).
 *
 * Vercel hosts only the shop APIs. The Astro/Tina site deploys on GitHub Pages.
 * Tina content pushes must NOT force an API redeploy (stock is read from GitHub
 * at runtime). Note: on Hobby, canceled/ignored builds still count toward the
 * 100 deployments/day quota — also disable Preview Deployments in the dashboard.
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

/** Paths that are bundled into Vercel serverless functions. */
const affectsApi = files.some((f) => {
  if (f.startsWith("api/")) return true;
  if (f.startsWith("server/")) return true;
  if (f === "vercel.json" || f === "package.json" || f === "package-lock.json") return true;
  // Shared modules imported by api/* (types + product-status, paypal-lines, …).
  if (f.startsWith("src/lib/")) return true;
  return false;
});

if (!affectsApi) {
  console.log("Skip Vercel build — no API paths in diff (Tina/Pages-only is fine):");
  for (const f of files) console.log(`  ${f}`);
  process.exit(0);
}

console.log("Continue Vercel build — API-related changes detected");
process.exit(1);
}
