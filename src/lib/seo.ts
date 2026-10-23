import { mediaUrl } from "./paths";
import { commerce } from "../data/commerce";
import { site } from "../data/site";

/** Absolute URL for Open Graph / JSON-LD (respects site + base). */
export function absoluteUrl(pathOrUrl: string, siteUrl: URL | string | undefined) {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const siteHref = typeof siteUrl === "string" ? siteUrl : siteUrl?.href;
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

/** Sitewide Organization / Store for Google (invisible to the UI). */
export function organizationJsonLd(siteUrl: URL | string | undefined) {
  const origin = absoluteUrl("/", siteUrl).replace(/\/$/, "") || "https://www.corpoceleste.eu";
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store"],
    name: "Corpoceleste",
    legalName: commerce.legalName,
    url: `${origin}/`,
    logo: absoluteUrl("brand/logo-stella.png", siteUrl),
    email: site.email,
    vatID: commerce.vatId || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: commerce.indirizzo || site.indirizzo,
      addressLocality: "Nembro",
      addressRegion: "BG",
      postalCode: "24027",
      addressCountry: "IT",
    },
    sameAs: [site.instagram, site.ultrastruttura].filter(Boolean),
  };
}

/** Person schema for the Bio page. */
export function personJsonLd(opts: {
  siteUrl: URL | string | undefined;
  name: string;
  description?: string;
  image?: string;
}) {
  const origin = absoluteUrl("/", opts.siteUrl).replace(/\/$/, "") || "https://www.corpoceleste.eu";
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    jobTitle: "Serigrafo",
    description: opts.description ? metaSnippet(opts.description, 300) : undefined,
    url: `${origin}/bio/`,
    image: opts.image ? absoluteUrl(opts.image, opts.siteUrl) : undefined,
    worksFor: {
      "@type": "Organization",
      name: "Corpoceleste",
      url: `${origin}/`,
    },
    sameAs: [site.instagram, site.ultrastruttura, site.corpoc].filter(Boolean),
  };
}
