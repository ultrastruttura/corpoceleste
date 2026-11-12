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

export function siteOrigin(siteUrl: URL | string | undefined) {
  return absoluteUrl("/", siteUrl).replace(/\/$/, "") || "https://www.corpoceleste.eu";
}

export function metaSnippet(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

const ORG_DESCRIPTION =
  "Corpoceleste — serigrafia d'artista a un colore, stampata a mano a Nembro / Bergamo da Andrea Baldelli Lorenzo. Maglie serigrafate, stampe d'artista ed edizioni limitate (non print-on-demand). Spedizione in Italia e in Europa.";

/** Sitewide Organization / Store / LocalBusiness for Google + LLM crawlers. */
export function organizationJsonLd(siteUrl: URL | string | undefined) {
  const origin = siteOrigin(siteUrl);
  const logo = absoluteUrl("brand/logo-stella.png", siteUrl);
  const image = absoluteUrl("videos/og-stage.jpg", siteUrl);
  const address = {
    "@type": "PostalAddress",
    streetAddress: commerce.indirizzo || site.indirizzo,
    addressLocality: "Nembro",
    addressRegion: "BG",
    postalCode: "24027",
    addressCountry: "IT",
  };
  const geo = {
    "@type": "GeoCoordinates",
    // Lonno / Nembro (BG) — approximate studio area
    latitude: 45.7436,
    longitude: 9.7608,
  };
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store", "LocalBusiness"],
    "@id": `${origin}/#organization`,
    name: "Corpoceleste",
    alternateName: ["Corpo Celeste", "CC Corpoceleste"],
    legalName: commerce.legalName,
    url: `${origin}/`,
    logo: {
      "@type": "ImageObject",
      url: logo,
    },
    image: [image, logo],
    email: site.email,
    telephone: site.telefono || undefined,
    vatID: commerce.vatId || undefined,
    description: ORG_DESCRIPTION,
    slogan: site.tagline,
    foundingDate: "2024",
    foundingLocation: {
      "@type": "Place",
      name: "Bergamo, Italia",
    },
    areaServed: [
      { "@type": "Country", name: "Italy" },
      { "@type": "AdministrativeArea", name: "European Union" },
      { "@type": "City", name: "Bergamo" },
      { "@type": "City", name: "Nembro" },
    ],
    knowsAbout: [
      "serigrafia",
      "serigrafia a mano",
      "screen printing",
      "maglia serigrafata",
      "longsleeve serigrafata",
      "artist print",
      "stampa d'artista",
      "edizione limitata",
      "wearable art",
      "workshop serigrafia",
      "corso serigrafia Bergamo",
    ],
    address,
    geo,
    hasMap: "https://www.openstreetmap.org/?mlat=45.7436&mlon=9.7608#map=14/45.7436/9.7608",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: site.email,
      availableLanguage: ["Italian", "English", "German"],
      areaServed: ["IT", "EU"],
    },
    sameAs: [site.instagram, site.ultrastruttura].filter(Boolean),
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Serigrafia d'artista e workshop",
        description:
          "Edizioni serigrafiche a un colore, maglie e stampe; workshop di stampa a mano in studio a Bergamo o presso terzi.",
      },
    },
  };
}

/** WebSite node — pairs with Organization; helps agents resolve the brand home. */
export function websiteJsonLd(siteUrl: URL | string | undefined) {
  const origin = siteOrigin(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    name: "Corpoceleste",
    alternateName: ["Corpo Celeste"],
    url: `${origin}/`,
    inLanguage: ["it", "en", "de"],
    description: ORG_DESCRIPTION,
    publisher: { "@id": `${origin}/#organization` },
    about: { "@id": `${origin}/#organization` },
  };
}

/** Person schema for the Bio page. */
export function personJsonLd(opts: {
  siteUrl: URL | string | undefined;
  name: string;
  description?: string;
  image?: string;
}) {
  const origin = siteOrigin(opts.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${origin}/bio/#person`,
    name: opts.name,
    alternateName: ["Andrea Lorenzo Baldelli", "Andrea Baldelli", "Andrea Baldelli Lorenzo"],
    jobTitle: "Serigrafo",
    description: opts.description
      ? metaSnippet(opts.description, 400)
      : "Serigrafo a Bergamo, fondatore di Corpoceleste. Workshop, consulenza ed edizioni limitate.",
    url: `${origin}/bio/`,
    image: opts.image ? absoluteUrl(opts.image, opts.siteUrl) : undefined,
    homeLocation: {
      "@type": "Place",
      name: "Nembro / Bergamo, Italia",
    },
    knowsAbout: [
      "serigrafia",
      "screen printing",
      "workshop serigrafia",
      "edizione limitata",
      "stampa su tessuto",
      "stampa su carta",
    ],
    worksFor: { "@id": `${origin}/#organization` },
    sameAs: [site.instagram, site.ultrastruttura].filter(Boolean),
  };
}

/** BreadcrumbList for product and content pages. */
export function breadcrumbJsonLd(
  siteUrl: URL | string | undefined,
  items: Array<{ name: string; path: string }>,
) {
  const origin = siteOrigin(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path.startsWith("http")
        ? item.path
        : `${origin}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

/** FAQPage from short Q/A pairs already shown on the page. */
export function faqPageJsonLd(entries: Array<{ question: string; answer: string }>) {
  const mainEntity = entries
    .map((e) => ({
      question: e.question.replace(/\s+/g, " ").trim(),
      answer: e.answer.replace(/\s+/g, " ").trim(),
    }))
    .filter((e) => e.question && e.answer)
    .map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.answer,
      },
    }));
  if (!mainEntity.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}
