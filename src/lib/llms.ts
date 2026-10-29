import { getAbsoluteLocaleUrl } from "astro:i18n";
import { bioField, bioPage } from "../data/bio";
import { news, newsField } from "../data/news";
import {
  artistName,
  productSeoDescription,
  type Product,
} from "../data/products";
import { localizedSetting } from "../data/settings";
import { upcomingWorkshops } from "../data/workshops";
import type { Locale } from "../i18n/locales";
import {
  discoveryArtists,
  discoveryProducts,
} from "./discovery";

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

export function llmsFullTxtUrl(locale: Locale) {
  const root = siteRoot();
  return locale === "it" ? `${root}/llms-full.txt` : `${root}/${locale}/llms-full.txt`;
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
      "Corpoceleste è lo shop di Andrea Baldelli Lorenzo (P. IVA IT04952110163), serigrafo a Nembro / Bergamo: un colore, telaio a mano, pezzi numerati. Non è print-on-demand. Keyword utili: maglia serigrafata, serigrafia a mano, arte indossabile, edizione limitata, stampa d'artista, Bergamo, Satellite Press.",
    shop: "Shop",
    products: "Prodotti",
    productsEmpty:
      "Il catalogo si aggiorna quando le edizioni sono pronte — i pezzi pubblicati compaiono qui e nelle schede /prodotto/…",
    artists: "Artisti",
    artistsEmpty: "Le schede artista si pubblicano insieme alle edizioni.",
    news: "News",
    studio: "Studio e servizi",
    legal: "Info legali",
    optional: "Optional",
    languages: "Lingue",
    full: "Contenuto esteso",
    home: "Home",
    homeNote: "Vetrina Corpoceleste: maglie serigrafate e stampe d'artista.",
    artistsIndex: "Elenco artisti",
    artistsNote: "Collaborazioni di serigrafia e stampe d'artista.",
    newsIndex: "News",
    newsNote: "Annunci su edizioni, maglie e workshop.",
    contact: "Contatti",
    contactNote: "info@corpoceleste.eu — Andrea Baldelli Lorenzo, serigrafo a Bergamo.",
    workshops: "Corsi di serigrafia",
    workshopsNote: "Workshop di stampa a mano in studio o presso terzi; iscrizioni e calendario sulla pagina.",
    bio: "Bio",
    bioNote:
      "Andrea Baldelli Lorenzo — serigrafo a Bergamo, fondatore di Corpoceleste; consulenza, workshop e progetti di edizione.",
    terms: "Condizioni di vendita",
    privacy: "Privacy",
    cookies: "Cookie",
    withdrawal: "Recesso",
    statusAvailable: "disponibile",
    statusPreorder: "preordine",
    statusSoldout: "esaurito",
    otherLangs: "Altre lingue",
  },
  en: {
    summary:
      "One-colour artist screen printing, hand-printed in Bergamo. Screen-printed shirts, artist prints and limited editions — wearable art, not print-on-demand. Shipping in Italy and across Europe.",
    about:
      "Corpoceleste is the shop of Andrea Baldelli Lorenzo (VAT IT04952110163), screen printer in Nembro / Bergamo: one colour, hand-pulled screens, numbered pieces. Not print-on-demand. Useful terms: screen-printed shirt, hand screen print, wearable art, limited edition, artist print, Bergamo, Satellite Press.",
    shop: "Shop",
    products: "Products",
    productsEmpty:
      "The catalogue updates when editions are ready — published pieces appear here and under /prodotto/…",
    artists: "Artists",
    artistsEmpty: "Artist pages publish with the editions.",
    news: "News",
    studio: "Studio and services",
    legal: "Legal",
    optional: "Optional",
    languages: "Languages",
    full: "Extended content",
    home: "Home",
    homeNote: "Corpoceleste showcase: screen-printed shirts and artist prints.",
    artistsIndex: "Artist list",
    artistsNote: "Screen-print and artist-print collaborations.",
    newsIndex: "News",
    newsNote: "Updates on editions, shirts and workshops.",
    contact: "Contact",
    contactNote: "info@corpoceleste.eu — Andrea Baldelli Lorenzo, screen printer in Bergamo.",
    workshops: "Screen-printing workshops",
    workshopsNote: "Hand-printing workshops in the studio or on location; signup and schedule on the page.",
    bio: "Bio",
    bioNote:
      "Andrea Baldelli Lorenzo — screen printer in Bergamo, founder of Corpoceleste; consulting, workshops and edition projects.",
    terms: "Terms of sale",
    privacy: "Privacy",
    cookies: "Cookies",
    withdrawal: "Withdrawal",
    statusAvailable: "available",
    statusPreorder: "pre-order",
    statusSoldout: "sold out",
    otherLangs: "Other languages",
  },
  de: {
    summary:
      "Einfarbiger Künstlersiebdruck, handgedruckt in Bergamo. Siebdruck-Shirts, Künstlerdrucke und limitierte Editionen — wearable art, kein Print-on-Demand. Versand in Italien und Europa.",
    about:
      "Corpoceleste ist der Shop von Andrea Baldelli Lorenzo (USt-IdNr. IT04952110163), Siebdrucker in Nembro / Bergamo: eine Farbe, Handzug, nummerierte Stücke. Kein Print-on-Demand. Nützliche Begriffe: Siebdruck-Shirt, Handsiebdruck, wearable art, limitierte Edition, Künstlerdruck, Bergamo, Satellite Press.",
    shop: "Shop",
    products: "Produkte",
    productsEmpty:
      "Der Katalog wird aktualisiert, wenn Editionen fertig sind — veröffentlichte Stücke erscheinen hier und unter /prodotto/…",
    artists: "Künstler",
    artistsEmpty: "Künstlerseiten erscheinen mit den Editionen.",
    news: "News",
    studio: "Atelier und Angebote",
    legal: "Rechtliches",
    optional: "Optional",
    languages: "Sprachen",
    full: "Erweiterter Inhalt",
    home: "Start",
    homeNote: "Corpoceleste-Schaufenster: Siebdruck-Shirts und Künstlerdrucke.",
    artistsIndex: "Künstlerliste",
    artistsNote: "Siebdruck- und Künstlerdruck-Kollaborationen.",
    newsIndex: "News",
    newsNote: "Updates zu Editionen, Shirts und Workshops.",
    contact: "Kontakt",
    contactNote: "info@corpoceleste.eu — Andrea Baldelli Lorenzo, Siebdrucker in Bergamo.",
    workshops: "Siebdruck-Kurse",
    workshopsNote: "Handdruck-Workshops im Atelier oder vor Ort; Anmeldung und Termine auf der Seite.",
    bio: "Bio",
    bioNote:
      "Andrea Baldelli Lorenzo — Siebdrucker in Bergamo, Gründer von Corpoceleste; Beratung, Workshops und Editionsprojekte.",
    terms: "Verkaufsbedingungen",
    privacy: "Datenschutz",
    cookies: "Cookies",
    withdrawal: "Widerruf",
    statusAvailable: "verfügbar",
    statusPreorder: "Vorbestellung",
    statusSoldout: "ausverkauft",
    otherLangs: "Andere Sprachen",
  },
} as const;

type LlmLocale = keyof typeof copy;

function note(text: string) {
  return text.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

function statusLabel(locale: LlmLocale, product: Product) {
  const t = copy[locale];
  if (product.status === "preorder") return t.statusPreorder;
  if (product.status === "soldout") return t.statusSoldout;
  return t.statusAvailable;
}

function productLine(locale: LlmLocale, product: Product) {
  const desc = note(productSeoDescription(product, locale));
  const artist = artistName(product.artistId);
  const price = Number.isFinite(product.price) && product.price > 0 ? `${product.price} €` : "";
  const bits = [desc, artist && artist !== product.title ? artist : "", price, statusLabel(locale, product)]
    .filter(Boolean)
    .join(" · ");
  return `- [${product.title}](${abs(locale, `prodotto/${product.slug}/`)}): ${bits}`;
}

function languageLinks(locale: LlmLocale) {
  const langs: Locale[] = ["it", "en", "de"];
  const labels = { it: "Italiano", en: "English", de: "Deutsch" };
  return langs
    .filter((l) => l !== locale)
    .map((l) => `- [${labels[l]} llms.txt](${llmsTxtUrl(l)})`)
    .join("\n");
}

/** Compact Markdown llms.txt (spec llmstxt.org) — IT / EN / DE. */
export function buildLlmsTxt(locale: LlmLocale) {
  const t = copy[locale];
  const meta = localizedSetting("metaDescription", locale) || t.summary;
  const listedProducts = discoveryProducts().sort((a, b) =>
    a.title.localeCompare(b.title, locale),
  );
  const listedArtists = discoveryArtists();

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

  lines.push("", `## ${t.products}`, "");
  if (listedProducts.length) {
    for (const p of listedProducts) lines.push(productLine(locale, p));
  } else {
    lines.push(t.productsEmpty);
  }

  lines.push("", `## ${t.artists}`, "");
  lines.push(`- [${t.artistsIndex}](${abs(locale, "artisti/")}): ${t.artistsNote}`);
  if (listedArtists.length) {
    for (const a of listedArtists) {
      const desc = note(
        a.seoDescription[locale] || a.seoDescription.it || a.bio[locale] || a.bio.it || a.name,
      );
      lines.push(`- [${a.name}](${abs(locale, `artisti/${a.slug}/`)}): ${desc}`);
    }
  } else {
    lines.push(t.artistsEmpty);
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
    `- [${t.bio}](${abs(locale, "bio/")}): ${t.bioNote}`,
    "",
    `## ${t.languages}`,
    "",
    languageLinks(locale),
    "",
    `## ${t.optional}`,
    "",
    `- [${t.full} (llms-full.txt)](${llmsFullTxtUrl(locale)})`,
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

/** Longer companion file for agents that fetch extended context. */
export function buildLlmsFullTxt(locale: LlmLocale) {
  const t = copy[locale];
  const bioBody = note(bioField("body", locale)).slice(0, 1200);
  const workshopLines =
    upcomingWorkshops.length > 0
      ? upcomingWorkshops
          .map(
            (w) =>
              `- ${w.when} — ${w.where} (${w.organizer})${w.signupUrl ? `: ${w.signupUrl}` : ""}`,
          )
          .join("\n")
      : "";

  const lines = [
    "# Corpoceleste — full",
    "",
    `> ${note(localizedSetting("metaDescription", locale) || t.summary)}`,
    "",
    t.about,
    "",
    `## ${t.bio}`,
    "",
    bioBody || t.bioNote,
    "",
    `Name: ${bioPage.name}`,
    `Contact: info@corpoceleste.eu`,
    `Site: ${abs(locale)}`,
    "",
    `## ${t.workshops}`,
    "",
    t.workshopsNote,
  ];

  if (workshopLines) {
    lines.push("", workshopLines);
  }

  lines.push(
    "",
    `See also the compact index: [llms.txt](${llmsTxtUrl(locale)})`,
    "",
  );

  return lines.join("\n");
}

function basePath(path: string) {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}

/** AI crawlers that read public pages — explicit Allow (site is already Allow: /). */
const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "meta-externalagent",
] as const;

/** robots.txt: private paths blocked; llms pointers; AI bots allowed. */
export function buildRobotsTxt() {
  const disallow = [
    "/admin/",
    "/admin/index.html",
    "/account/",
    "/account/auth/",
    "/carrello/",
    "/checkout/",
    "/grazie/",
    "/en/account/",
    "/en/account/auth/",
    "/en/carrello/",
    "/en/checkout/",
    "/en/grazie/",
    "/de/account/",
    "/de/account/auth/",
    "/de/carrello/",
    "/de/checkout/",
    "/de/grazie/",
  ];

  const lines = [
    "# Corpoceleste — serigrafia d'artista / artist screen printing (Bergamo)",
    "# Maglie serigrafate, stampe d'artista, edizioni limitate — arte indossabile",
    "#",
    `# llms.txt: ${llmsTxtUrl("it")} | ${llmsTxtUrl("en")} | ${llmsTxtUrl("de")}`,
    `# llms-full.txt: ${llmsFullTxtUrl("it")} | ${llmsFullTxtUrl("en")} | ${llmsFullTxtUrl("de")}`,
    "#",
    "User-agent: *",
    "Allow: /",
    ...disallow.map((p) => `Disallow: ${basePath(p)}`),
    "",
  ];

  for (const bot of AI_BOTS) {
    lines.push(`User-agent: ${bot}`, "Allow: /", "");
  }

  lines.push(`Sitemap: ${sitemapUrl()}`, "");

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
