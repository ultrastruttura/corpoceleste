export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
};

export const news: NewsItem[] = [
  {
    slug: "una-maglia-nuova",
    title: "Una maglia nuova",
    date: "2026-08-14",
    excerpt: "A breve una collaborazione. Un colore. Non è una ristampa.",
    body: `A breve in shop una maglia con un disegno di Ada Neri.

Un colore, cotone, come le altre. Non è una ristampa e non è un’edizione numerata: quando il telaio è in macchina, stampo.

Il disegno c’è. Le maglie no. Le metto in vetrina quando le ho finite, non prima.`,
  },
];

export function newsBySlug(slug: string) {
  return news.find((n) => n.slug === slug);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}
