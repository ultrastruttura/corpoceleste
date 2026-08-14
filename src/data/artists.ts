export type Artist = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  instagram?: string;
};

export const artists: Artist[] = [
  { id: "daniele-de-batte", slug: "daniele-de-batte", name: "Daniele De Batté", bio: "" },
  { id: "dr-pira", slug: "dr-pira", name: "Dr. Pira", bio: "" },
  { id: "rocco-lombardi", slug: "rocco-lombardi", name: "Rocco Lombardi", bio: "" },
  { id: "ruco", slug: "ruco", name: "Ruco", bio: "" },
  { id: "ratigher", slug: "ratigher", name: "Ratigher", bio: "" },
  { id: "angelini-taddei", slug: "angelini-taddei", name: "Angelini & Taddei", bio: "" },
  { id: "centootto", slug: "108", name: "108", bio: "" },
  { id: "millo", slug: "millo", name: "Millo", bio: "" },
];

export function artistById(id: string) {
  return artists.find((a) => a.id === id);
}

export function artistBySlug(slug: string) {
  return artists.find((a) => a.slug === slug);
}
