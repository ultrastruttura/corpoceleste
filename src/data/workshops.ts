import matter from "gray-matter";

export type PastWorkshop = {
  year: number;
  items: string[];
};

/** Workshop aperti all’iscrizione (link all’organizzatore). */
export type UpcomingWorkshop = {
  when: string;
  where: string;
  organizer: string;
  /** URL iscrizione / pagina evento dell’organizzatore */
  signupUrl: string;
  note?: string;
};

const upcomingFiles = import.meta.glob("../../content/workshops/upcoming/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const pastFiles = import.meta.glob("../../content/workshops/past/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const upcomingWorkshops: UpcomingWorkshop[] = Object.entries(upcomingFiles)
  .map(([, raw]) => {
    const { data } = matter(raw);
    const note = String(data.note ?? "").trim();
    return {
      when: String(data.when ?? "").trim(),
      where: String(data.where ?? "").trim(),
      organizer: String(data.organizer ?? "").trim(),
      signupUrl: String(data.signupUrl ?? "").trim(),
      ...(note ? { note } : {}),
    };
  })
  .filter((w) => w.when && w.where && w.organizer && w.signupUrl);

type PastEntry = { year: number; title: string; path: string };

const pastEntries: PastEntry[] = Object.entries(pastFiles)
  .map(([path, raw]) => {
    const { data } = matter(raw);
    return {
      path,
      year: Number(data.year) || 0,
      title: String(data.title ?? "").trim(),
    };
  })
  .filter((e) => e.year > 0 && e.title);

/** Archivio raggruppato per anno (anni nuovi prima). */
export const pastWorkshops: PastWorkshop[] = (() => {
  const byYear = new Map<number, string[]>();
  for (const e of pastEntries) {
    const list = byYear.get(e.year) ?? [];
    list.push(e.title);
    byYear.set(e.year, list);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items }));
})();
