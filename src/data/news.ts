import matter from "gray-matter";
import type { Locale } from "../i18n/locales";

export type Localized = { it: string; en: string; de: string };

export type NewsItem = {
  slug: string;
  date: string;
  title: Localized;
  excerpt: Localized;
  body: Localized;
};

const files = import.meta.glob("../../content/news/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const news: NewsItem[] = Object.entries(files)
  .map(([path, raw]) => {
    const { data } = matter(raw);
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const date =
      data.date instanceof Date
        ? data.date.toISOString().slice(0, 10)
        : String(data.date ?? "").slice(0, 10);
    return {
      slug,
      date,
      title: {
        it: String(data.title_it ?? ""),
        en: String(data.title_en ?? ""),
        de: String(data.title_de ?? ""),
      },
      excerpt: {
        it: String(data.excerpt_it ?? ""),
        en: String(data.excerpt_en ?? ""),
        de: String(data.excerpt_de ?? ""),
      },
      body: {
        it: String(data.body_it ?? ""),
        en: String(data.body_en ?? ""),
        de: String(data.body_de ?? ""),
      },
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function newsBySlug(slug: string) {
  return news.find((n) => n.slug === slug);
}

export function newsField(item: NewsItem, locale: Locale, field: "title" | "excerpt" | "body") {
  return item[field][locale];
}
