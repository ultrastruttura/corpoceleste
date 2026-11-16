/**
 * Fail if any product frontmatter `images:` entry is missing under public/.
 * Catches Tina deletes / renames that leave broken references.
 *
 * Usage: node scripts/check-product-media.mjs
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dir = join(root, "content", "products");
const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

const missing = [];
const checked = [];

for (const file of files) {
  const raw = readFileSync(join(dir, file), "utf8");
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const block = fm[1];
  const imagesMatch = block.match(/^images:\r?\n((?:[ \t]*-[ \t]*.+\r?\n?)*)/m);
  if (!imagesMatch) continue;
  const paths = [...imagesMatch[1].matchAll(/^[ \t]*-[ \t]*["']?([^"'\r\n]+)["']?[ \t]*$/gm)].map(
    (m) => m[1].trim(),
  );
  for (const p of paths) {
    if (!p || /^https?:\/\//i.test(p)) continue;
    const rel = p.replace(/^\//, "");
    checked.push(`${file} → ${rel}`);
    if (!existsSync(join(root, "public", rel))) {
      missing.push(`${file}: public/${rel}`);
    }
  }
}

if (missing.length) {
  console.error("Product media missing on disk (Tina path broken):");
  for (const m of missing) console.error(`  - ${m}`);
  console.error(
    "\nFix: re-upload in Tina, or restore the file under public/uploads/, then commit both markdown + file.",
  );
  process.exit(1);
}

console.log(`OK: ${checked.length} product image path(s) exist under public/`);
