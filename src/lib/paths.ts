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

/**
 * Shop/product image URLs.
 * Tina writes the real file under `public/uploads/` — always serve that path.
 * Do not invent `/uploads/prints/card|lg/` derivatives (they are not generated).
 */
export function cardImageUrls(path: string) {
  const full = mediaUrl(path);
  return { webp: full, jpg: full, full };
}

/** Same as card: original Tina media only. */
export function largeImageUrls(path: string) {
  const full = mediaUrl(path);
  return { webp: full, jpg: full, full };
}
