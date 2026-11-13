/**
 * Regenerate Tina lock from tina/config.ts and fail if it drifts from git.
 *
 *   npm run check:tina
 *
 * Prevents Pages deploy surprises (ERR_CLOUD_CHECK_FAILED) when schema
 * fields change without committing tina/tina-lock.json.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const lockRel = path.join("tina", "tina-lock.json");
const lockPath = path.join(root, lockRel);
const tinacmsBin = path.join(
  root,
  "node_modules",
  "@tinacms",
  "cli",
  "bin",
  "tinacms",
);

if (!existsSync(tinacmsBin)) {
  console.error("Missing @tinacms/cli — run npm ci first.");
  process.exit(1);
}
if (!existsSync(path.join(root, "tina", "config.ts"))) {
  console.error("Missing tina/config.ts");
  process.exit(1);
}

console.log("Running: tinacms build --local --skip-cloud-checks");
const build = spawnSync(
  process.execPath,
  [tinacmsBin, "build", "--local", "--skip-cloud-checks"],
  { cwd: root, stdio: "inherit", env: process.env },
);
if (build.status !== 0) {
  console.error("tinacms build failed");
  process.exit(build.status || 1);
}

if (!existsSync(lockPath)) {
  console.error(`Expected ${lockRel} after build — file missing.`);
  process.exit(1);
}

let diff = "";
try {
  diff = execFileSync("git", ["diff", "--", lockRel], {
    cwd: root,
    encoding: "utf8",
  });
} catch (err) {
  console.error("git diff failed:", err.message || err);
  process.exit(1);
}

if (diff.trim()) {
  console.error(`\n${lockRel} is out of date vs tina/config.ts.\n`);
  console.error(diff.slice(0, 4000));
  console.error(
    "\nFix: commit the updated lock file (after this command regenerates it),\n" +
      "or run: npx tinacms build --local --skip-cloud-checks && git add tina/tina-lock.json",
  );
  process.exit(1);
}

console.log(`OK: ${lockRel} matches tina/config.ts`);
