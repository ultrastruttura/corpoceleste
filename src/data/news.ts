import type { Locale } from "../i18n/locales";

export type Localized = { it: string; en: string; de: string };

export type NewsItem = {
  slug: string;
  date: string;
  title: Localized;
  excerpt: Localized;
  body: Localized;
};

export const news: NewsItem[] = [
  {
    slug: "una-maglia-nuova",
    date: "2026-08-14",
    title: {
      it: "Una maglia nuova",
      en: "A new shirt",
      de: "Ein neues Shirt",
    },
    excerpt: {
      it: "A breve in shop una maglia con un disegno di Ada Neri. Un colore, cotone, come le altre.",
      en: "A shirt with a drawing by Ada Neri is coming to the shop. One colour, cotton, like the others.",
      de: "Bald im Shop: ein Shirt mit einer Zeichnung von Ada Neri. Eine Farbe, Baumwolle, wie die anderen.",
    },
    body: {
      it: `A breve in shop una maglia con un disegno di Ada Neri.

Un colore, cotone, come le altre. Non è una ristampa e non è un’edizione numerata: quando il telaio è in macchina, stampo.

Il disegno c’è. Le maglie no. Le metto in vetrina quando le ho finite, non prima.`,
      en: `A shirt with a drawing by Ada Neri is coming to the shop.

One colour, cotton, like the others. It isn’t a reprint and it isn’t a numbered edition: when the screen is on the press, I print.

The drawing is ready. The shirts are not. They go in the shop when they’re done, not before.`,
      de: `Bald im Shop: ein Shirt mit einer Zeichnung von Ada Neri.

Eine Farbe, Baumwolle, wie die anderen. Kein Nachdruck und keine nummerierte Edition: wenn der Rahmen auf der Maschine ist, drucke ich.

Die Zeichnung ist da. Die Shirts nicht. Die kommen ins Schaufenster, wenn sie fertig sind, nicht früher.`,
    },
  },
];

export function newsBySlug(slug: string) {
  return news.find((n) => n.slug === slug);
}

export function newsField(item: NewsItem, locale: Locale, field: "title" | "excerpt" | "body") {
  return item[field][locale];
}
