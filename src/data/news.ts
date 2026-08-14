export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
};

export const news: NewsItem[] = [];

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
