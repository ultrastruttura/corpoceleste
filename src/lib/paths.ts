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
