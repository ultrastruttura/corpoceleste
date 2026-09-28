import { mediaUrl } from "./paths";

/** Absolute URL for Open Graph / JSON-LD (respects site + base). */
export function absoluteUrl(pathOrUrl: string, site: URL | string | undefined) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const siteHref = typeof site === "string" ? site : site?.href;
  const relative = mediaUrl(pathOrUrl.replace(/^\//, ""));
  if (!siteHref) return relative;
  // mediaUrl already includes BASE_URL — join from origin only to avoid /base/base/...
  return new URL(relative, `${new URL(siteHref).origin}/`).href;
}

export function metaSnippet(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
