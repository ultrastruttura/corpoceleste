import { getAbsoluteLocaleUrl } from "astro:i18n";
import { artistName } from "../data/artists";
import { bioField, bioPage } from "../data/bio";
import { commerce } from "../data/commerce";
import { fitModels } from "../data/fit-models";
import { news, newsField } from "../data/news";
import {
  productDescription,
  productHasSizes,
  productSeoDescription,
  type Product,
  type ProductKind,
} from "../data/products";
import { localizedSetting } from "../data/settings";
import { site } from "../data/site";
import { pastWorkshops, upcomingWorkshops } from "../data/workshops";
import { ui } from "../i18n/dict";
import type { Locale } from "../i18n/locales";
import {
  discoveryArtists,
  discoveryProducts,
} from "./discovery";
import {
  formatProductBlurb,
  formatProductFacts,
  note,
  productBodyForAgents,
  stripMarkdownLinks,
} from "./llms-format";
import { PICKUP_BERGAMO } from "./pickup";

function abs(locale: Locale, path = "") {
  const p = path.replace(/^\/+|\/+$/g, "");
  let href = getAbsoluteLocaleUrl(locale, p);
  if (!href.endsWith("/")) href += "/";
  return href;
}

function siteRoot() {
  const siteHref = String(import.meta.env.SITE || "").replace(/\/$/, "");
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${siteHref}${base}`;
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
      "Corpoceleste — serigrafia d'artista a un colore, stampata a mano a Nembro / Bergamo. Maglie serigrafate, shopper, longsleeve, stampe d'artista ed edizioni limitate (non print-on-demand). Workshop di serigrafia in studio o on-site. Spedizione Italia e UE. Guida taglie, bio, corsi, contatti.",
    about:
      "Corpoceleste (una parola, brand CORPOCELESTE) è lo shop di Andrea Baldelli Lorenzo (P. IVA IT04952110163), serigrafo a Nembro / Lonno / Bergamo: un colore, telaio a mano, pezzi unici in edizione limitata. Aperto a collaborazioni (stampe d’autore, serigrafie) con artisti e band, con esperienza DIY discografica (CORPOC, TDD records). Non è print-on-demand e non è il venue omonimo corpoceleste.com. Query utili: maglia serigrafata, shopper serigrafata, longsleeve serigrafata, serigrafia a mano Bergamo, workshop serigrafia Bergamo, corso serigrafia, stampa d'artista, edizione limitata, arte indossabile, collaborazione artisti band, merch DIY, guida taglie maglia, Corpoceleste, corpoceleste.eu.",
    shop: "Shop",
    products: "Prodotti",
    productsEmpty:
      "Il catalogo si aggiorna quando le edizioni sono pronte — i pezzi pubblicati compaiono qui e nelle schede /prodotto/…",
    artists: "Artisti",
    artistsEmpty: "Le schede artista si pubblicano insieme alle edizioni.",
    news: "News",
    studio: "Studio e servizi",
    facts: "Scheda entity",
    faq: "Domande frequenti",
    shippingPay: "Spedizione e pagamento",
    sizeChart: "Tabella taglie (cm, capo disteso)",
    handmadeNote:
      "Ogni pezzo è stampato a mano in edizione limitata: piccole variazioni di posizione, pressione e resa dell’inchiostro sono parte del lavoro artigianale (non difetti).",
    legal: "Info legali",
    optional: "Optional",
    languages: "Lingue",
    full: "Contenuto esteso",
    home: "Home",
    homeNote:
      "Vetrina Corpoceleste: serigrafia a mano a Bergamo, maglie e stampe.",
    artistsIndex: "Elenco artisti",
    artistsNote: "Collaborazioni di serigrafia e stampe d'artista.",
    newsIndex: "News",
    newsNote: "Annunci su edizioni, maglie e workshop.",
    contact: "Contatti",
    contactNote:
      "info@corpoceleste.eu — Andrea Baldelli Lorenzo, serigrafo a Nembro / Bergamo.",
    workshops: "Corsi di serigrafia",
    workshopsNote:
      "Workshop / corso di serigrafia a mano in studio a Bergamo o nella tua città; lista d’attesa e organizzazione sulla pagina.",
    sizeGuide: "Guida alle taglie",
    sizeGuideNote:
      "Misure maglie Corpoceleste (A larghezza, B lunghezza) per taglia S–XXL — fit regular.",
    bio: "Bio",
    bioNote:
      "Andrea Baldelli Lorenzo — serigrafo a Bergamo, fondatore di Corpoceleste; consulenza, workshop, edizioni e collaborazioni con artisti e band.",
    collab:
      "Aperto a collaborazioni: stampe d’autore e serigrafie con artisti e band. Esperienza DIY discografica (CORPOC, TDD records / hardcore indipendente) + studio a Bergamo. Scrivi da Contatti.",
    archive: "Archivio workshop",
    upcoming: "Prossimi workshop",
    terms: "Condizioni di vendita",
    privacy: "Privacy",
    cookies: "Cookie",
    withdrawal: "Recesso",
    statusAvailable: "disponibile",
    statusPreorder: "preordine",
    statusSoldout: "esaurito",
    otherLangs: "Altre lingue",
    kindShirt: "maglia",
    kindPrint: "stampa",
    kindShopper: "shopper",
    kindEdition: "edizione",
    sizesLabel: "taglie",
    colorLabel: "colore",
    compositionLabel: "composizione",
    faqWhatQ: "Cos’è Corpoceleste?",
    faqWhatA:
      "È lo shop di serigrafia d’artista di Andrea Baldelli Lorenzo a Nembro / Bergamo: maglie, shopper e stampe a un colore, stampate a mano in edizione limitata — non print-on-demand.",
    faqWhereQ: "Dove stampate?",
    faqWhereA:
      "In studio a Lonno / Nembro (BG), Italia (Via Moroni 51). Workshop anche on-site in altre città.",
    faqPodQ: "È print-on-demand?",
    faqPodA:
      "No. Ogni edizione è stampata a mano, pezzo per pezzo; le variazioni di stampa sono parte del lavoro artigianale.",
    faqNameQ: "Siete il locale / venue «Corpoceleste»?",
    faqNameA:
      "No. Questo è lo shop di serigrafia su corpoceleste.eu — non confondere con attività omonime non collegate (es. corpoceleste.com).",
    faqShipQ: "Spedite in Italia e in Europa?",
    faqShipA:
      "Sì: spedizione a domicilio via Sendcloud (Italia e UE, quote in checkout) oppure ritiro a mano zona Bergamo a 0 €.",
    faqPayQ: "Come si paga?",
    faqPayA:
      "PayPal (carta / Apple Pay / Google Pay) oppure bonifico. Con bonifico il pezzo non è riservato finché non arriva il pagamento.",
    faqCollabQ: "Fate collaborazioni con artisti o band?",
    faqCollabA:
      "Sì: stampe d’autore e serigrafie con artisti e band. Porto l’esperienza DIY discografica (edizioni limitate, merch, circuiti indipendenti) e il lavoro in studio a Bergamo — scrivi da Contatti.",
    faqWorkshopQ: "Dove si tengono i workshop di serigrafia?",
  },
  en: {
    summary:
      "Corpoceleste — one-colour artist screen printing, hand-printed in Nembro / Bergamo. Screen-printed shirts, totes, longsleeves, artist prints and limited editions (not print-on-demand). Screen-printing workshops in-studio or on location. Shipping Italy & EU. Size guide, bio, workshops, contact.",
    about:
      "Corpoceleste (one word, brand CORPOCELESTE) is the shop of Andrea Baldelli Lorenzo (VAT IT04952110163), screen printer in Nembro / Lonno / Bergamo: one colour, hand-printed screens, unique limited-edition pieces. Open to collaborations (artist prints, screen printing) with artists and bands, with a DIY record-world background (CORPOC, TDD records). Not print-on-demand and not the unrelated venue corpoceleste.com. Useful queries: screen-printed shirt, screen-printed tote, hand screen print Bergamo, screen-printing workshop Bergamo, limited edition, artist print, wearable art, artist band collaboration, DIY merch, size guide, Corpoceleste, corpoceleste.eu.",
    shop: "Shop",
    products: "Products",
    productsEmpty:
      "The catalogue updates when editions are ready — published pieces appear here and under /prodotto/…",
    artists: "Artists",
    artistsEmpty: "Artist pages publish with the editions.",
    news: "News",
    studio: "Studio and services",
    facts: "Entity fact sheet",
    faq: "Frequently asked questions",
    shippingPay: "Shipping and payment",
    sizeChart: "Size chart (cm, garment laid flat)",
    handmadeNote:
      "Every piece is hand-printed in a limited edition: small variations in placement, pressure and ink coverage are part of handmade work (not defects).",
    legal: "Legal",
    optional: "Optional",
    languages: "Languages",
    full: "Extended content",
    home: "Home",
    homeNote:
      "Corpoceleste showcase: hand screen printing in Bergamo, shirts and prints.",
    artistsIndex: "Artist list",
    artistsNote: "Screen-print and artist-print collaborations.",
    newsIndex: "News",
    newsNote: "Updates on editions, shirts and workshops.",
    contact: "Contact",
    contactNote:
      "info@corpoceleste.eu — Andrea Baldelli Lorenzo, screen printer in Nembro / Bergamo.",
    workshops: "Screen-printing workshops",
    workshopsNote:
      "Hand screen-printing workshop in the Bergamo studio or in your city; waitlist and hosting form on the page.",
    sizeGuide: "Size guide",
    sizeGuideNote:
      "Corpoceleste shirt measurements (A width, B length) by size S–XXL — regular fit.",
    bio: "Bio",
    bioNote:
      "Andrea Baldelli Lorenzo — screen printer in Bergamo, founder of Corpoceleste; consulting, workshops, editions and collaborations with artists and bands.",
    collab:
      "Open to collaborations: artist prints and screen printing with artists and bands. DIY record-world experience (CORPOC, TDD records / independent hardcore) + Bergamo studio. Write via Contact.",
    archive: "Workshop archive",
    upcoming: "Upcoming workshops",
    terms: "Terms of sale",
    privacy: "Privacy",
    cookies: "Cookies",
    withdrawal: "Withdrawal",
    statusAvailable: "available",
    statusPreorder: "pre-order",
    statusSoldout: "sold out",
    otherLangs: "Other languages",
    kindShirt: "shirt",
    kindPrint: "print",
    kindShopper: "tote",
    kindEdition: "edition",
    sizesLabel: "sizes",
    colorLabel: "colour",
    compositionLabel: "composition",
    faqWhatQ: "What is Corpoceleste?",
    faqWhatA:
      "It is Andrea Baldelli Lorenzo’s artist screen-printing shop in Nembro / Bergamo: one-colour shirts, totes and prints, hand-printed in limited editions — not print-on-demand.",
    faqWhereQ: "Where do you print?",
    faqWhereA:
      "In the studio in Lonno / Nembro (BG), Italy (Via Moroni 51). Workshops also on location in other cities.",
    faqPodQ: "Is it print-on-demand?",
    faqPodA:
      "No. Each edition is hand-printed piece by piece; print variations are part of the craft.",
    faqNameQ: "Are you the «Corpoceleste» venue?",
    faqNameA:
      "No. This is the screen-printing shop at corpoceleste.eu — not the unrelated venue corpoceleste.com.",
    faqShipQ: "Do you ship in Italy and the EU?",
    faqShipA:
      "Yes: home delivery via Sendcloud (Italy & EU, quote at checkout) or local pickup in the Bergamo area for €0.",
    faqPayQ: "How do I pay?",
    faqPayA:
      "PayPal (card / Apple Pay / Google Pay) or bank transfer. With bank transfer the piece is not reserved until payment arrives.",
    faqCollabQ: "Do you collaborate with artists or bands?",
    faqCollabA:
      "Yes: artist prints and screen printing with artists and bands. I bring DIY record-world experience (limited editions, merch, independent circuits) and studio work in Bergamo — write via Contact.",
    faqWorkshopQ: "Where are Corpoceleste screen-printing workshops held?",
  },
  de: {
    summary:
      "Corpoceleste — einfarbiger Künstlersiebdruck, handgedruckt in Nembro / Bergamo. Siebdruck-Shirts, Shopper, Longsleeves, Künstlerdrucke und limitierte Editionen (kein Print-on-Demand). Siebdruck-Workshops im Atelier oder vor Ort. Versand Italien & EU. Größenratgeber, Bio, Kurse, Kontakt.",
    about:
      "Corpoceleste (ein Wort, Marke CORPOCELESTE) ist der Shop von Andrea Baldelli Lorenzo (USt-IdNr. IT04952110163), Siebdrucker in Nembro / Lonno / Bergamo: eine Farbe, von Hand gedruckt, Unikate in limitierter Auflage. Offen für Kollaborationen (Künstlerdrucke, Siebdruck) mit Künstler:innen und Bands, mit DIY-Erfahrung aus der Plattenwelt (CORPOC, TDD records). Kein Print-on-Demand und nicht die gleichnamige Location corpoceleste.com. Nützliche Suchen: Siebdruck-Shirt, Siebdruck-Shopper, Handsiebdruck Bergamo, Siebdruck-Workshop Bergamo, limitierte Edition, Künstlerdruck, tragbare Kunst, Band-Merch Kollaboration, DIY Merch, Größenratgeber, Corpoceleste, corpoceleste.eu.",
    shop: "Shop",
    products: "Produkte",
    productsEmpty:
      "Der Katalog wird aktualisiert, wenn Editionen fertig sind — veröffentlichte Stücke erscheinen hier und unter /prodotto/…",
    artists: "Künstler",
    artistsEmpty: "Künstlerseiten erscheinen mit den Editionen.",
    news: "News",
    studio: "Atelier und Angebote",
    facts: "Entity-Steckbrief",
    faq: "Häufige Fragen",
    shippingPay: "Versand und Zahlung",
    sizeChart: "Größentabelle (cm, flach liegend)",
    handmadeNote:
      "Jedes Stück wird von Hand in limitierter Auflage gedruckt: kleine Abweichungen bei Position, Druck und Farbdeckung gehören zur Handarbeit (keine Mängel).",
    legal: "Rechtliches",
    optional: "Optional",
    languages: "Sprachen",
    full: "Erweiterter Inhalt",
    home: "Start",
    homeNote:
      "Corpoceleste-Schaufenster: Handsiebdruck in Bergamo, Shirts und Drucke.",
    artistsIndex: "Künstlerliste",
    artistsNote: "Siebdruck- und Künstlerdruck-Kollaborationen.",
    newsIndex: "News",
    newsNote: "Updates zu Editionen, Shirts und Workshops.",
    contact: "Kontakt",
    contactNote:
      "info@corpoceleste.eu — Andrea Baldelli Lorenzo, Siebdrucker in Nembro / Bergamo.",
    workshops: "Siebdruck-Kurse",
    workshopsNote:
      "Handsiebdruck-Workshop im Atelier in Bergamo oder bei euch; Warteliste und Organisationsformular auf der Seite.",
    sizeGuide: "Größenratgeber",
    sizeGuideNote:
      "Corpoceleste-Shirt-Maße (A Breite, B Länge) nach Größe S–XXL — Regular Fit.",
    bio: "Bio",
    bioNote:
      "Andrea Baldelli Lorenzo — Siebdrucker in Bergamo, Gründer von Corpoceleste; Beratung, Workshops, Editionen und Kollaborationen mit Künstler:innen und Bands.",
    collab:
      "Offen für Kollaborationen: Künstlerdrucke und Siebdruck mit Künstler:innen und Bands. DIY-Platten-Erfahrung (CORPOC, TDD records / unabhängiger Hardcore) + Atelier in Bergamo. Schreib über Kontakt.",
    archive: "Workshop-Archiv",
    upcoming: "Nächste Workshops",
    terms: "Verkaufsbedingungen",
    privacy: "Datenschutz",
    cookies: "Cookies",
    withdrawal: "Widerruf",
    statusAvailable: "verfügbar",
    statusPreorder: "Vorbestellung",
    statusSoldout: "ausverkauft",
    otherLangs: "Andere Sprachen",
    kindShirt: "Shirt",
    kindPrint: "Druck",
    kindShopper: "Shopper",
    kindEdition: "Edition",
    sizesLabel: "Größen",
    colorLabel: "Farbe",
    compositionLabel: "Zusammensetzung",
    faqWhatQ: "Was ist Corpoceleste?",
    faqWhatA:
      "Der Künstler-Siebdruck-Shop von Andrea Baldelli Lorenzo in Nembro / Bergamo: einfarbige Shirts, Shopper und Drucke, handgedruckt in limitierter Auflage — kein Print-on-Demand.",
    faqWhereQ: "Wo wird gedruckt?",
    faqWhereA:
      "Im Atelier in Lonno / Nembro (BG), Italien (Via Moroni 51). Workshops auch vor Ort in anderen Städten.",
    faqPodQ: "Ist es Print-on-Demand?",
    faqPodA:
      "Nein. Jede Edition wird Stück für Stück von Hand gedruckt; Druckabweichungen gehören zum Handwerk.",
    faqNameQ: "Seid ihr die Location «Corpoceleste»?",
    faqNameA:
      "Nein. Dies ist der Siebdruck-Shop auf corpoceleste.eu — nicht die gleichnamige, unabhängige Location corpoceleste.com.",
    faqShipQ: "Versendet ihr in Italien und der EU?",
    faqShipA:
      "Ja: Versand nach Hause über Sendcloud (Italien & EU, Angebot an der Kasse) oder Abholung in der Region Bergamo für 0 €.",
    faqPayQ: "Wie zahle ich?",
    faqPayA:
      "PayPal (Karte / Apple Pay / Google Pay) oder Überweisung. Bei Überweisung ist das Stück erst nach Zahlungseingang reserviert.",
    faqCollabQ: "Macht ihr Kollaborationen mit Künstler:innen oder Bands?",
    faqCollabA:
      "Ja: Künstlerdrucke und Siebdruck mit Künstler:innen und Bands. Ich bringe DIY-Platten-Erfahrung (limitierte Editionen, Merch, unabhängige Kreise) und Atelierarbeit in Bergamo mit — schreib über Kontakt.",
    faqWorkshopQ: "Wo finden Corpoceleste-Siebdruck-Workshops statt?",
  },
} as const;

type LlmLocale = keyof typeof copy;

function statusLabel(locale: LlmLocale, product: Product) {
  const t = copy[locale];
  if (product.status === "preorder") return t.statusPreorder;
  if (product.status === "soldout") return t.statusSoldout;
  return t.statusAvailable;
}

function kindLabel(locale: LlmLocale, kind: ProductKind) {
  const t = copy[locale];
  if (kind === "print") return t.kindPrint;
  if (kind === "shopper") return t.kindShopper;
  if (kind === "edition") return t.kindEdition;
  return t.kindShirt;
}

function productFacts(locale: LlmLocale, product: Product) {
  const t = copy[locale];
  return formatProductFacts({
    kindLabel: kindLabel(locale, product.kind),
    colorLabel: t.colorLabel,
    compositionLabel: t.compositionLabel,
    sizesLabel: t.sizesLabel,
    colorName: product.colorName,
    composition: product.composition,
    hasSizes: productHasSizes(product),
    sizes: product.sizes,
    artist: artistName(product.artistId),
    title: product.title,
    price: product.price,
    statusLabel: statusLabel(locale, product),
  });
}

function productBlurb(locale: LlmLocale, product: Product, max = 280) {
  return formatProductBlurb({
    seo: productSeoDescription(product, locale),
    description: productDescription(product, locale),
    facts: productFacts(locale, product),
    max,
  });
}

function productLine(locale: LlmLocale, product: Product) {
  const blurb = productBlurb(locale, product);
  const facts = productFacts(locale, product);
  const tail = blurb === facts ? facts : `${blurb} · ${facts}`;
  return `- [${product.title}](${abs(locale, `prodotto/${product.slug}/`)}): ${tail}`;
}

function productFullBlock(locale: LlmLocale, product: Product) {
  const lines = [
    `### [${product.title}](${abs(locale, `prodotto/${product.slug}/`)})`,
    "",
    productFacts(locale, product),
  ];
  const seo = note(productSeoDescription(product, locale));
  const body = productBodyForAgents(productDescription(product, locale));
  if (seo && seo !== body.slice(0, seo.length)) {
    lines.push("", seo);
  }
  if (body) {
    const clipped = body.length > 1200 ? `${body.slice(0, 1199).trim()}…` : body;
    if (!seo || clipped !== seo) lines.push("", clipped);
  }
  return lines.join("\n");
}

function languageLinks(locale: LlmLocale) {
  const langs: Locale[] = ["it", "en", "de"];
  const labels = { it: "Italiano", en: "English", de: "Deutsch" };
  return langs
    .filter((l) => l !== locale)
    .map((l) => `- [${labels[l]} llms.txt](${llmsTxtUrl(l)})`)
    .join("\n");
}

function entityFacts(locale: LlmLocale) {
  return [
    `- Name: Corpoceleste (CORPOCELESTE)`,
    `- Legal: ${commerce.legalName}`,
    `- VAT: ${commerce.vatId}`,
    `- Address: ${commerce.indirizzo || site.indirizzo}`,
    `- Email: ${site.email}`,
    commerce.pec ? `- PEC: ${commerce.pec}` : "",
    commerce.sdiCode ? `- SDI: ${commerce.sdiCode}` : "",
    `- Site: ${abs(locale)}`,
    `- Instagram: ${site.instagram}`,
    `- Related: ${site.ultrastruttura}`,
    `- Previous editions project: CORPOC — ${site.corpoc}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function faqBlock(locale: LlmLocale) {
  const t = copy[locale];
  const dict = ui[locale];
  const pairs = [
    [t.faqWhatQ, t.faqWhatA],
    [t.faqWhereQ, t.faqWhereA],
    [t.faqPodQ, t.faqPodA],
    [t.faqNameQ, t.faqNameA],
    [t.faqShipQ, t.faqShipA],
    [t.faqPayQ, t.faqPayA],
    [t.faqCollabQ, t.faqCollabA],
    [t.faqWorkshopQ, dict.workshops.waitlistBody],
    [
      locale === "en"
        ? "Can you run a workshop in my city?"
        : locale === "de"
          ? "Könnt ihr einen Workshop in meiner Stadt machen?"
          : "Potete organizzare un workshop nella mia città?",
      dict.workshops.onSiteBody,
    ],
    [dict.sizeGuide.faqMeasureQ, dict.sizeGuide.faqMeasureA],
    [dict.sizeGuide.faqBetweenQ, dict.sizeGuide.faqBetweenA],
    [dict.sizeGuide.faqUnitQ, dict.sizeGuide.faqUnitA],
  ];
  return pairs.map(([q, a]) => `### ${q}\n\n${note(a)}`).join("\n\n");
}

function sizeChartBlock(locale: LlmLocale) {
  const model = fitModels[0];
  const rows = model?.rows?.length
    ? model.rows
    : site.sizeChart.map((r) => ({
        size: r.size,
        chest: r.chest,
        length: r.length,
        sleeve: r.sleeve,
      }));
  const title = model?.name ? `${model.name}` : copy[locale].sizeGuideNote;
  const lines = [`${title}:`, ""];
  for (const r of rows) {
    const sleeve = "sleeve" in r && Number(r.sleeve) > 0 ? `, C ${r.sleeve}` : "";
    lines.push(`- ${r.size}: A ${r.chest} · B ${r.length}${sleeve}`);
  }
  return lines.join("\n");
}

function shippingPayBlock(locale: LlmLocale) {
  const dict = ui[locale];
  const days = commerce.shippingDays || site.shippingDays;
  return [
    note(dict.checkout.shippingBody),
    "",
    note(dict.checkout.vatIncluded),
    "",
    `- ${dict.checkout.deliveryCourier}: Sendcloud (IT / EU)`,
    `- ${dict.checkout.deliveryPickup}: ${PICKUP_BERGAMO.serviceName} · 0 €`,
    note(dict.checkout.deliveryPickupNote),
    "",
    `- ${dict.checkout.methodPaypal}`,
    `- ${dict.checkout.bank}: ${note(dict.checkout.bankNote)}`,
    `- ${locale === "en" ? "Indicative ship window" : locale === "de" ? "Richtwert Versand" : "Tempi spedizione indicativi"}: ~${days} ${locale === "en" ? "working days" : locale === "de" ? "Werktage" : "giorni lavorativi"}`,
  ].join("\n");
}

function workshopsIntro(locale: LlmLocale) {
  return note(ui[locale].workshops.intro.replace(/\n+/g, " "));
}

function upcomingBlock(locale: LlmLocale) {
  if (!upcomingWorkshops.length) {
    return note(ui[locale].workshops.upcomingEmpty);
  }
  return upcomingWorkshops
    .map((w) => {
      const noteBit = w.note ? ` — ${w.note}` : "";
      const link = w.signupUrl ? `: ${w.signupUrl}` : "";
      return `- ${w.when} — ${w.where} (${w.organizer})${noteBit}${link}`;
    })
    .join("\n");
}

function archiveBlock() {
  if (!pastWorkshops.length) return "";
  return pastWorkshops
    .slice(0, 8)
    .map((y) => {
      const sample = y.items.slice(0, 6).join("; ");
      const more = y.items.length > 6 ? ` (+${y.items.length - 6})` : "";
      return `- ${y.year} (${y.items.length}): ${sample}${more}`;
    })
    .join("\n");
}

/** Compact Markdown llms.txt (spec llmstxt.org) — IT / EN / DE. */
export function buildLlmsTxt(locale: LlmLocale) {
  const t = copy[locale];
  const meta = localizedSetting("metaDescription", locale) || t.summary;
  const homeLede = localizedSetting("homeLede", locale);
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
  ];

  if (homeLede) {
    lines.push(note(homeLede), "");
  }

  lines.push(t.handmadeNote, "", `## ${t.facts}`, "", entityFacts(locale));

  lines.push(
    "",
    `## ${t.shop}`,
    "",
    `- [${t.home}](${abs(locale)}): ${t.homeNote}`,
  );

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
        a.seoDescription[locale] ||
          a.seoDescription.it ||
          a.bio[locale] ||
          a.bio.it ||
          a.name,
      );
      const ig = a.instagram ? ` · ${a.instagram}` : "";
      lines.push(`- [${a.name}](${abs(locale, `artisti/${a.slug}/`)}): ${desc}${ig}`);
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
    `- [${t.workshops}](${abs(locale, "corsi/")}): ${workshopsIntro(locale) || t.workshopsNote}`,
    `- [${t.sizeGuide}](${abs(locale, "guida-taglie/")}): ${t.sizeGuideNote}`,
    `- [${t.bio}](${abs(locale, "bio/")}): ${t.bioNote}`,
    `- ${t.collab}`,
    "",
    `## ${t.faq}`,
    "",
    `- ${t.faqWhatQ} ${t.faqWhatA}`,
    `- ${t.faqWhereQ} ${t.faqWhereA}`,
    `- ${t.faqPodQ} ${t.faqPodA}`,
    `- ${t.faqNameQ} ${t.faqNameA}`,
    `- ${t.faqShipQ} ${t.faqShipA}`,
    `- ${t.faqPayQ} ${t.faqPayA}`,
    `- ${t.faqCollabQ} ${t.faqCollabA}`,
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
  const meta = localizedSetting("metaDescription", locale) || t.summary;
  const bioBody = note(stripMarkdownLinks(bioField("body", locale)));
  const listedProducts = discoveryProducts().sort((a, b) =>
    a.title.localeCompare(b.title, locale),
  );
  const listedArtists = discoveryArtists();
  const archive = archiveBlock();

  const lines: string[] = [
    "# Corpoceleste — full",
    "",
    `> ${note(meta)}`,
    "",
    t.about,
    "",
    t.handmadeNote,
    "",
    `## ${t.facts}`,
    "",
    entityFacts(locale),
    "",
    `## ${t.bio}`,
    "",
    `Name: ${bioPage.name}`,
    `Contact: ${site.email}`,
    `Site: ${abs(locale)}`,
    "",
    bioBody || t.bioNote,
    "",
    `## ${t.faq}`,
    "",
    faqBlock(locale),
    "",
    `## ${t.products}`,
    "",
  ];

  if (listedProducts.length) {
    for (const p of listedProducts) {
      lines.push(productFullBlock(locale, p), "");
    }
  } else {
    lines.push(t.productsEmpty, "");
  }

  lines.push(`## ${t.artists}`, "");
  if (listedArtists.length) {
    for (const a of listedArtists) {
      const desc = note(
        a.seoDescription[locale] || a.seoDescription.it || a.bio[locale] || a.bio.it || "",
      );
      const linked = discoveryProducts().filter((p) => p.artistId === a.id);
      lines.push(`### [${a.name}](${abs(locale, `artisti/${a.slug}/`)})`, "");
      if (desc) lines.push(desc, "");
      if (a.instagram) lines.push(`Instagram: ${a.instagram}`, "");
      if (linked.length) {
        lines.push(
          linked.map((p) => `- [${p.title}](${abs(locale, `prodotto/${p.slug}/`)})`).join("\n"),
          "",
        );
      }
    }
  } else {
    lines.push(t.artistsEmpty, "");
  }

  lines.push(
    `## ${t.workshops}`,
    "",
    workshopsIntro(locale) || t.workshopsNote,
    "",
    `### ${t.upcoming}`,
    "",
    upcomingBlock(locale),
    "",
  );

  if (archive) {
    lines.push(`### ${t.archive}`, "", archive, "");
  }

  lines.push(
    `## ${t.sizeGuide}`,
    "",
    note(ui[locale].sizeGuide.howBody),
    "",
    note(ui[locale].sizeGuide.howChest),
    note(ui[locale].sizeGuide.howLength),
    "",
    note(ui[locale].sizeGuide.tipRegular),
    "",
    `### ${t.sizeChart}`,
    "",
    sizeChartBlock(locale),
    "",
    `## ${t.shippingPay}`,
    "",
    shippingPayBlock(locale),
    "",
  );

  if (news.length) {
    lines.push(`## ${t.news}`, "");
    for (const n of [...news].sort((a, b) => b.date.localeCompare(a.date))) {
      const title = newsField(n, locale, "title");
      const excerpt = note(newsField(n, locale, "excerpt"));
      const body = note(stripMarkdownLinks(newsField(n, locale, "body"))).slice(0, 800);
      lines.push(`### [${title}](${abs(locale, `news/${n.slug}/`)})`, "", `${n.date} — ${excerpt}`);
      if (body) lines.push("", body);
      lines.push("");
    }
  }

  lines.push(
    `## ${t.legal}`,
    "",
    `- [${t.terms}](${abs(locale, "vendita/")})`,
    `- [${t.privacy}](${abs(locale, "privacy/")})`,
    `- [${t.cookies}](${abs(locale, "cookie/")})`,
    `- [${t.withdrawal}](${abs(locale, "recesso/")})`,
    "",
    `See also the compact index: [llms.txt](${llmsTxtUrl(locale)})`,
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
