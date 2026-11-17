import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, extname, join } from "node:path";

export function url(path = "") {
  const base = import.meta.env.BASE_URL;
  const clean = path.replace(/^\//, "");
  return clean ? `${base}${clean}` : base;
}

export function asset(path: string) {
  return url(path.replace(/^\//, ""));
}

/** Public media path from Tina (`/uploads/...`) or absolute URL. */
export function mediaUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return asset(path.replace(/^\//, ""));
}

function uploadBasename(path: string) {
  const clean = path.replace(/^\//, "").replace(/^uploads\//, "");
  return basename(clean);
}

/** Same naming as scripts/derive-product-images.mjs */
function derivedFileName(uploadFile: string) {
  const stem = basename(uploadFile, extname(uploadFile));
  const tag = createHash("sha1").update(uploadFile).digest("hex").slice(0, 8);
  return `${stem}.${tag}.webp`;
}

function derivedUrl(path: string, kind: "card" | "lg") {
  if (!path || /^https?:\/\//i.test(path)) return "";
  const file = uploadBasename(path);
  if (!file) return "";
  const rel = `derived/${kind}/${derivedFileName(file)}`;
  if (!existsSync(join(process.cwd(), "public", rel))) return "";
  return asset(rel);
}

/**
 * Shop/product image URLs.
 * Prefer build-time WebP derivatives (npm run derive:images); fall back to Tina original.
 */
export function cardImageUrls(path: string) {
  const original = mediaUrl(path);
  const card = derivedUrl(path, "card") || original;
  const lg = derivedUrl(path, "lg") || original;
  return { webp: card, jpg: original, full: card, card, lg, original };
}

/** Product stage / OG: prefer lg WebP. */
export function largeImageUrls(path: string) {
  const original = mediaUrl(path);
  const card = derivedUrl(path, "card") || original;
  const lg = derivedUrl(path, "lg") || original;
  return { webp: lg, jpg: original, full: lg, card, lg, original };
}
