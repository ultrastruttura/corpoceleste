import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("public/uploads/prints");

async function writeSet(subdir, width, quality) {
  const out = path.join(dir, subdir);
  fs.mkdirSync(out, { recursive: true });
  const files = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f));
  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, "");
    const input = path.join(dir, f);
    await sharp(input)
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toFile(path.join(out, `${base}.webp`));
    await sharp(input)
      .rotate()
      .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toFile(path.join(out, `${base}.jpg`));
    console.log(`${subdir}:`, f);
  }
}

await writeSet("card", 800, 72);
await writeSet("lg", 1200, 78);
