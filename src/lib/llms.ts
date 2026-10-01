import { getAbsoluteLocaleUrl } from "astro:i18n";
import { artists, artistSeoDescription } from "../data/artists";
import { news, newsField } from "../data/news";
import {
  artistName,
  productSeoDescription,
  products,
} from "../data/products";
import { localizedSetting } from "../data/settings";
import type { Locale } from "../i18n/locales";

function abs(locale: Locale, path = "") {
  const p = path.replace(/^\/+|\/+$/g, "");
  let href = getAbsoluteLocaleUrl(locale, p);
  if (!href.endsWith("/")) href += "/";
  return href;
}

function siteRoot() {
  const site = String(import.meta.env.SITE || "").replace(/\/$/, "");
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${site}${base}`;
}

export function llmsTxtUrl(locale: Locale) {
  const root = siteRoot();
  return locale === "it" ? `${root}/llms.txt` : `${root}/${locale}/llms.txt`;
}

export function robotsTxtUrl() {
  return `${siteRoot()}/robots.txt`;
}

export function sitemapUrl() {
  return `${siteRoot()}/sitemap-index.xml`;
}

const copy = {
  it: {
    summary:
      "Serigrafia d'artista a un colore, stampata a mano a Bergamo. Maglie serigrafate, stampe d'artista ed edizioni limitate — arte indossabile, non print-on-demand. Spedizione in Italia e in Europa.",
    about:
      "Corpoceleste è lo shop di Andrea Baldelli: serigrafia artistica su cotone e stampe d'artista (anche edizioni Satellite Press). Keyword utili: maglia serigrafata, serigrafia a mano, arte indossabile, edizione limitata, stampa d'artista, Bergamo.",
    shop: "Shop",
    products: "Prodotti",
    artists: "Artisti",
    news: "News",
    studio: "Studio e servizi",
    legal: "Info legali",
    optional: "Optional",
    languages: "Lingue",
    home: "Home — catalogo maglie e stampe",
    homeNote: "Vetrina prodotti: maglie serigrafate e stampe d'artista Corpoceleste.",
    artistsIndex: "Elenco artisti",
    artistsNote: "Collaborazioni di serigrafia e stampe d'artista.",
    newsIndex: "News",
    newsNote: "Annunci su maglie nuove, edizioni e workshop.",
    contact: "Contatti",
    contactNote: "Andrea Baldelli, serigrafo a Bergamo — info@corpoceleste.eu.",
    workshops: "Corsi di serigrafia",
    workshopsNote: "Workshop di stampa a mano in studio o presso di voi.",
    consulting: "Consulenza",
    consultingNote: "Impianti, inchiostri, flussi di lavoro, stampa dal vivo.",
    terms: "Condizioni di vendita",
    privacy: "Privacy",
    cookies: "Cookie",
    withdrawal: "Recesso",
    otherLang: "English llms.txt",
    otherLangNote: "Same site map in English.",
  },
  en: {
    summary:
      "One-colour artist screen printing, hand-printed in Bergamo. Screen-printed shirts, artist prints and limited editions — wearable art, not print-on-demand. Shipping in Italy and across Europe.",
    about:
      "Corpoceleste is Andrea Baldelli's shop: artist screen printing on cotton and artist prints (including Satellite Press editions). Useful terms: screen-printed shirt, hand screen print, wearable art, limited edition, artist print, Bergamo.",
    shop: "Shop",
    products: "Products",
    artists: "Artists",
    news: "News",
    studio: "Studio and services",
    legal: "Legal",
    optional: "Optional",
    languages: "Languages",
    home: "Home — shirt and print catalogue",
    homeNote: "Product grid: Corpoceleste screen-printed shirts and artist prints.",
    artistsIndex: "Artist list",
    artistsNote: "Screen-print and artist-print collaborations.",
    newsIndex: "News",
    newsNote: "Updates on new shirts, editions and workshops.",
    contact: "Contact",
    contactNote: "Andrea Baldelli, screen printer in Bergamo — info@corpoceleste.eu.",
    workshops: "Screen-printing workshops",
    workshopsNote: "Hand-printing workshops in the studio or on location.",
    consulting: "Consulting",
    consultingNote: "Setups, inks, workflow, live printing.",
    terms: "Terms of sale",
    privacy: "Privacy",
    cookies: "Cookies",
    withdrawal: "Withdrawal",
    otherLang: "Italian llms.txt",
    otherLangNote: "Same site map in Italian.",
  },
} as const;

type LlmLocale = keyof typeof copy;

function note(text: string) {
  return text.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

/** Markdown llms.txt (spec llmstxt.org) per lingua IT/EN. */
export function buildLlmsTxt(locale: LlmLocale) {
  const t = copy[locale];
  const meta =
    localizedSetting("metaDescription", locale) || t.summary;
  const lines: string[] = [
    "# Corpoceleste",
    "",
    `> ${note(meta)}`,
    "",
    t.about,
    "",
    `## ${t.shop}`,
    "",
    `- [${t.home}](${abs(locale)}): ${t.homeNote}`,
  ];

  const sorted = [...products].sort((a, b) => a.title.localeCompare(b.title, locale));
  if (sorted.length) {
    lines.push("", `## ${t.products}`, "");
    for (const p of sorted) {
      const artist = artistName(p.artistId);
      const desc = note(productSeoDescription(p, locale));
      lines.push(`- [${p.title}](${abs(locale, `prodotto/${p.slug}/`)}): ${desc}`);
    }
  }

  lines.push("", `## ${t.artists}`, "");
  lines.push(`- [${t.artistsIndex}](${abs(locale, "artisti/")}): ${t.artistsNote}`);
  for (const a of [...artists].sort((x, y) => x.name.localeCompare(y.name, locale))) {
    const desc = note(artistSeoDescription(a, locale) || a.name);
    lines.push(`- [${a.name}](${abs(locale, `artisti/${a.slug}/`)}): ${desc}`);
  }

  if (news.length) {
    lines.push("", `## ${t.news}`, "");
    lines.push(`- [${t.newsIndex}](${abs(locale, "news/")}): ${t.newsNote}`);
    for (const n of [...news].sort((a, b) => b.date.localeCompare(a.date))) {
      const title = newsField(n, locale, "title");
      const excerpt = note(newsField(n, locale, "excerpt"));
      lines.push(`- [${title}](${abs(locale, `news/${n.slug}/`)}): ${excerpt}`);
    }
  }

  lines.push(
    "",
    `## ${t.studio}`,
    "",
    `- [${t.contact}](${abs(locale, "contatti/")}): ${t.contactNote}`,
    `- [${t.workshops}](${abs(locale, "corsi/")}): ${t.workshopsNote}`,
    `- [${t.consulting}](${abs(locale, "consulenza/")}): ${t.consultingNote}`,
    "",
    `## ${t.languages}`,
    "",
  );

  if (locale === "it") {
    lines.push(`- [${t.otherLang}](${llmsTxtUrl("en")}): ${t.otherLangNote}`);
  } else {
    lines.push(`- [${t.otherLang}](${llmsTxtUrl("it")}): ${t.otherLangNote}`);
  }

  lines.push(
    "",
    `## ${t.optional}`,
    "",
    `- [${t.terms}](${abs(locale, "vendita/")}): ${t.terms}`,
    `- [${t.privacy}](${abs(locale, "privacy/")}): ${t.privacy}`,
    `- [${t.cookies}](${abs(locale, "cookie/")}): ${t.cookies}`,
    `- [${t.withdrawal}](${abs(locale, "recesso/")}): ${t.withdrawal}`,
    `- [robots.txt](${robotsTxtUrl()})`,
    `- [Sitemap](${sitemapUrl()})`,
    "",
  );

  return lines.join("\n");
}

function basePath(path: string) {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/** robots.txt con disallow checkout/admin e puntatori llms IT/EN. */
export function buildRobotsTxt() {
  const disallow = [
    "/admin/",
    "/account/",
    "/carrello/",
    "/checkout/",
    "/grazie/",
    "/en/carrello/",
    "/en/checkout/",
    "/en/grazie/",
    "/de/carrello/",
    "/de/checkout/",
    "/de/grazie/",
  ];

  const lines = [
    "# Corpoceleste — serigrafia d'artista / artist screen printing (Bergamo)",
    "# Maglie serigrafate, stampe d'artista, edizioni limitate — arte indossabile",
    "#",
    `# llms.txt (IT): ${llmsTxtUrl("it")}`,
    `# llms.txt (EN): ${llmsTxtUrl("en")}`,
    "#",
    "User-agent: *",
    "Allow: /",
    ...disallow.map((p) => `Disallow: ${basePath(p)}`),
    "",
    `Sitemap: ${sitemapUrl()}`,
    "",
  ];

  return lines.join("\n");
}

export function plainTextResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
