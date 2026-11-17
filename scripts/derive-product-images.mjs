/**
 * Build-time derivatives for shop LCP / cards / product stage.
 *
 *   npm run derive:images
 *
 * Writes WebP under public/derived/{card,lg}/ from public/uploads/.
 * card ≈ 640w · lg ≈ 1280w. Skips when output is newer than source.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const uploadsDir = join(root, "public", "uploads");
const cardDir = join(root, "public", "derived", "card");
const lgDir = join(root, "public", "derived", "lg");

const CARD_W = 640;
const LG_W = 1280;
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function outName(file) {
  const stem = basename(file, extname(file));
  // Stable short hash avoids collisions if two stems differ only by case/unicode.
  const tag = createHash("sha1").update(file).digest("hex").slice(0, 8);
  return `${stem}.${tag}.webp`;
}

function needsWrite(src, dest) {
  if (!existsSync(dest)) return true;
  return statSync(src).mtimeMs > statSync(dest).mtimeMs;
}

async function deriveOne(file) {
  const src = join(uploadsDir, file);
  const cardOut = join(cardDir, outName(file));
  const lgOut = join(lgDir, outName(file));
  const jobs = [];

  if (needsWrite(src, cardOut)) {
    jobs.push(
      sharp(src)
        .rotate()
        .resize({ width: CARD_W, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(cardOut)
        .then(() => console.log(`card  ${file} → ${basename(cardOut)}`)),
    );
  }
  if (needsWrite(src, lgOut)) {
    jobs.push(
      sharp(src)
        .rotate()
        .resize({ width: LG_W, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(lgOut)
        .then(() => console.log(`lg    ${file} → ${basename(lgOut)}`)),
    );
  }
  await Promise.all(jobs);
}

if (!existsSync(uploadsDir)) {
  console.log("No public/uploads — skip derive");
  process.exit(0);
}

mkdirSync(cardDir, { recursive: true });
mkdirSync(lgDir, { recursive: true });

const files = readdirSync(uploadsDir).filter((f) => {
  const ext = extname(f).toLowerCase();
  if (!IMAGE_EXT.has(ext)) return false;
  return statSync(join(uploadsDir, f)).isFile();
});

await Promise.all(files.map(deriveOne));
console.log(`OK: derived ${files.length} upload(s) → public/derived/{card,lg}/`);
