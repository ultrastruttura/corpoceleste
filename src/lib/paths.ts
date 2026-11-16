export function url(path = "") {
  const base = import.meta.env.BASE_URL;
  const clean = path.replace(/^\//, "");
  return clean ? `${base}${clean}` : base;
}

export function asset(path: string) {
  return url(path.replace(/^\//, ""));
}

/** Public media path from Tina (/uploads/...) or absolute URL. */
export function mediaUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return asset(path.replace(/^\//, ""));
}

function printStem(path: string) {
  const clean = path.replace(/^\//, "");
  const file = clean.split("/").pop() || "";
  return file.replace(/\.[^.]+$/, "");
}

/** True for legacy `/uploads/prints/...` originals that have card/lg derivatives. */
function hasPrintDerivatives(path: string) {
  if (/^https?:\/\//i.test(path)) return false;
  return path.replace(/^\//, "").startsWith("uploads/prints/");
}

/** Grid thumbnails: /uploads/prints/foo.jpg → /uploads/prints/card/foo.webp.
 *  Tina media in /uploads/... has no derivatives — use the original file. */
export function cardImageUrls(path: string) {
  const stem = printStem(path);
  if (!stem || !hasPrintDerivatives(path)) {
    const full = mediaUrl(path);
    return { webp: full, jpg: full, full };
  }
  return {
    webp: asset(`uploads/prints/card/${stem}.webp`),
    jpg: asset(`uploads/prints/card/${stem}.jpg`),
    full: mediaUrl(path),
  };
}

/** Product stage large derivative (same Tina fallback as card). */
export function largeImageUrls(path: string) {
  const stem = printStem(path);
  if (!stem || !hasPrintDerivatives(path)) {
    const full = mediaUrl(path);
    return { webp: full, jpg: full, full };
  }
  return {
    webp: asset(`uploads/prints/lg/${stem}.webp`),
    jpg: asset(`uploads/prints/lg/${stem}.jpg`),
    full: mediaUrl(path),
  };
}
