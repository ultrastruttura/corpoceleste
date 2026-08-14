import { artists } from "./artists";

export type ProductStatus = "available" | "soldout";

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
  print: string;
  sizes: string[];
  description: string;
};

export const products: Product[] = [
  {
    id: "daniele-de-batte",
    slug: "daniele-de-batte",
    title: "Daniele De Batté",
    artistId: "daniele-de-batte",
    price: 38,
    nuovo: true,
    createdAt: "2018-11-04",
    status: "available",
    color: "#141414",
    colorName: "Nero",
    print: "stella.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
  {
    id: "dr-pira-barba",
    slug: "ha-la-barba-spaziale",
    title: "Ha la barba spaziale",
    artistId: "dr-pira",
    price: 38,
    nuovo: true,
    createdAt: "2017-05-14",
    status: "available",
    color: "#5b3a8c",
    colorName: "Viola",
    print: "orbite.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
  {
    id: "rocco-lombardi",
    slug: "il-mio-cuore-e-una-zolla-di-terra",
    title: "Il mio cuore è una zolla di terra",
    artistId: "rocco-lombardi",
    price: 38,
    createdAt: "2017-05-14",
    status: "available",
    color: "#141414",
    colorName: "Nero",
    print: "raggio.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
  {
    id: "ruco",
    slug: "ruco",
    title: "Ruco",
    artistId: "ruco",
    price: 38,
    createdAt: "2017-05-14",
    status: "available",
    color: "#141414",
    colorName: "Nero",
    print: "meridiana.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
  {
    id: "ratigher",
    slug: "internet-si-rompera",
    title: "Internet si romperà",
    artistId: "ratigher",
    price: 38,
    createdAt: "2017-05-14",
    status: "available",
    color: "#141414",
    colorName: "Nero",
    print: "polarita.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
  {
    id: "anubi",
    slug: "anubi",
    title: "Anubi",
    artistId: "angelini-taddei",
    price: 38,
    createdAt: "2017-05-14",
    status: "available",
    color: "#141414",
    colorName: "Nero",
    print: "corpo.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
  {
    id: "108",
    slug: "mamuthones-e-issohadores",
    title: "Mamuthones e Issohadores",
    artistId: "centootto",
    price: 38,
    createdAt: "2017-05-14",
    status: "soldout",
    color: "#141414",
    colorName: "Nero",
    print: "notturno.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
  {
    id: "millo",
    slug: "millo",
    title: "Millo",
    artistId: "millo",
    price: 38,
    createdAt: "2017-05-14",
    status: "soldout",
    color: "#141414",
    colorName: "Nero",
    print: "eclisse.jpg",
    sizes: ["S", "M", "L", "XL"],
    description: "",
  },
];

export function productBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function productsByArtist(artistId: string) {
  return products.filter((p) => p.artistId === artistId);
}

export function artistName(artistId: string) {
  return artists.find((a) => a.id === artistId)?.name ?? artistId;
}

export function availableProducts() {
  return products.filter((p) => p.status === "available");
}

export function soldOutProducts() {
  return products.filter((p) => p.status === "soldout");
}

export function formatPrice(n: number) {
  return `${n} €`;
}
