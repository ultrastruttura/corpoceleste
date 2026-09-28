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

/** Grid thumbnails: /uploads/prints/foo.jpg → /uploads/prints/card/foo.webp */
export function cardImageUrls(path: string) {
  const stem = printStem(path);
  if (!stem || /^https?:\/\//i.test(path)) {
    const full = mediaUrl(path);
    return { webp: full, jpg: full, full };
  }
  return {
    webp: asset(`uploads/prints/card/${stem}.webp`),
    jpg: asset(`uploads/prints/card/${stem}.jpg`),
    full: mediaUrl(path),
  };
}

/** Product stage large derivative. */
export function largeImageUrls(path: string) {
  const stem = printStem(path);
  if (!stem || /^https?:\/\//i.test(path)) {
    const full = mediaUrl(path);
    return { webp: full, jpg: full, full };
  }
  return {
    webp: asset(`uploads/prints/lg/${stem}.webp`),
    jpg: asset(`uploads/prints/lg/${stem}.jpg`),
    full: mediaUrl(path),
  };
}
