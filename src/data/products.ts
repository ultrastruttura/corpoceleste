import matter from "gray-matter";
import { artistName, artists } from "./artists";
import type { Locale } from "../i18n/locales";

export type ProductStatus = "available" | "soldout";

export type Localized = { it: string; en: string; de: string };

export type Product = {
  id: string;
  slug: string;
  title: string;
  artistId: string;
  price: number;
  nuovo?: boolean;
  createdAt: string;
  status: ProductStatus;
  color: string;
  colorName: string;
  images: string[];
  /** First image path — kept for cart line thumbs */
  print: string;
  sizes: string[];
  description: Localized;
};

function emptyLocalized(): Localized {
  return { it: "", en: "", de: "" };
}

function asLocalized(value: unknown): Localized {
  if (!value || typeof value !== "object") return emptyLocalized();
  const o = value as Record<string, unknown>;
  return {
    it: String(o.it ?? ""),
    en: String(o.en ?? ""),
    de: String(o.de ?? ""),
  };
}

function artistIdFromRef(ref: unknown): string {
  const s = String(ref ?? "");
  const match = s.match(/artists\/([^/]+?)(?:\.md)?$/);
  return match?.[1] ?? s;
}

const files = import.meta.glob("../../content/products/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const products: Product[] = Object.entries(files).map(([path, raw]) => {
  const { data } = matter(raw);
  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  const images = Array.isArray(data.images)
    ? data.images.map((x: unknown) => String(x)).filter(Boolean)
    : [];
  const sizes = Array.isArray(data.sizes)
    ? data.sizes.map((x: unknown) => String(x))
    : ["S", "M", "L", "XL"];
  const created =
    data.createdAt instanceof Date
      ? data.createdAt.toISOString().slice(0, 10)
      : String(data.createdAt ?? "").slice(0, 10);

  return {
    id: slug,
    slug,
    title: String(data.title ?? slug),
    artistId: artistIdFromRef(data.artist),
    price: Number(data.price ?? 0),
    nuovo: Boolean(data.nuovo),
    createdAt: created || "2017-01-01",
    status: data.status === "soldout" ? "soldout" : "available",
    color: String(data.color ?? "#141414"),
    colorName: String(data.colorName ?? "Nero"),
    images,
    print: images[0] ?? "",
    sizes: sizes.length ? sizes : ["S", "M", "L", "XL"],
    description: asLocalized(data.description),
  };
});

export function productBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function productsByArtist(artistId: string) {
  return products.filter((p) => p.artistId === artistId);
}

export { artistName, artists };

export function availableProducts() {
  return products.filter((p) => p.status === "available");
}

export function soldOutProducts() {
  return products.filter((p) => p.status === "soldout");
}

export function formatPrice(n: number) {
  return `${n} €`;
}

export function productDescription(product: Product, locale: Locale) {
  return product.description[locale] || product.description.it || "";
}
