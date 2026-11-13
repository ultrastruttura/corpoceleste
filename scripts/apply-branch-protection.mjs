/**
 * Apply branch protection on main: require CI jobs before merge.
 *
 * Usage (after `gh auth login`):
 *   node scripts/apply-branch-protection.mjs
 *
 * Needs: repo admin + `gh` authenticated (or GH_TOKEN / GITHUB_TOKEN).
 */
import { execFileSync } from "node:child_process";

const OWNER = "ultrastruttura";
const REPO = "corpoceleste";
const BRANCH = "main";

/** Job `name:` values from .github/workflows/ci.yml */
const REQUIRED_CHECKS = ["Unit + check", "Build site", "E2E Chromium"];

function ghApi(method, path, body) {
  const args = ["api", "-X", method, path, "-H", "Accept: application/vnd.github+json"];
  if (body !== undefined) {
    args.push("--input", "-");
  }
  return execFileSync("gh", args, {
    input: body !== undefined ? JSON.stringify(body) : undefined,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

const body = {
  required_status_checks: {
    strict: true,
    // GitHub Actions job `name:` values (must have run at least once to appear).
    checks: REQUIRED_CHECKS.map((context) => ({ context })),
  },
  enforce_admins: false,
  required_pull_request_reviews: {
    required_approving_review_count: 0,
    dismiss_stale_reviews: false,
    require_code_owner_reviews: false,
  },
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
  required_conversation_resolution: false,
};

const path = `repos/${OWNER}/${REPO}/branches/${BRANCH}/protection`;

try {
  ghApi("PUT", path, body);
  console.log(`OK: protected ${OWNER}/${REPO}@${BRANCH}`);
  console.log("Required checks (strict):");
  for (const c of REQUIRED_CHECKS) console.log(`  - ${c}`);
} catch (err) {
  const msg = err.stderr?.toString?.() || err.message || String(err);
  console.error("Failed to apply branch protection.");
  console.error(msg);
  console.error("\nMake sure: gh auth login (repo admin), then re-run this script.");
  console.error(
    "Or UI: Settings → Branches → Add rule → Branch name pattern: main → Require status checks →",
    REQUIRED_CHECKS.join(", "),
  );
  process.exit(1);
}
