export function url(path = "") {
  const base = import.meta.env.BASE_URL;
  const clean = path.replace(/^\//, "");
  return clean ? `${base}${clean}` : base;
}

export function asset(path: string) {
  return url(path.replace(/^\//, ""));
}
