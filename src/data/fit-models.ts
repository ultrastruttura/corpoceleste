import matter from "gray-matter";
import { site } from "./site";

export type FitModelKind = "shirt" | "hoodie";

export type FitModelRow = {
  size: string;
  chest: number;
  length: number;
  sleeve: number;
};

export type FitModel = {
  id: string;
  slug: string;
  name: string;
  kind: FitModelKind;
  rows: FitModelRow[];
};

function parseKind(raw: unknown): FitModelKind {
  return raw === "hoodie" ? "hoodie" : "shirt";
}

function parseRows(raw: unknown): FitModelRow[] {
  if (!Array.isArray(raw)) return [];
  const out: FitModelRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const size = String(o.size ?? "").trim();
    if (!size) continue;
    const chest = Number(o.chest);
    const length = Number(o.length);
    const sleeve = Number(o.sleeve);
    out.push({
      size,
      chest: Number.isFinite(chest) ? chest : 0,
      length: Number.isFinite(length) ? length : 0,
      sleeve: Number.isFinite(sleeve) ? sleeve : 0,
    });
  }
  return out;
}

/** Tina reference `content/fit-models/tee-default.md` → `tee-default`. */
export function fitModelIdFromRef(ref: unknown): string {
  const s = String(ref ?? "").trim();
  if (!s) return "";
  const match = s.match(/fit-models\/([^/]+?)(?:\.md)?$/);
  return match?.[1] ?? s.replace(/\.md$/, "");
}

const files = import.meta.glob("../../content/fit-models/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const fitModels: FitModel[] = Object.entries(files)
  .map(([path, raw]) => {
    const { data } = matter(raw);
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    return {
      id: slug,
      slug,
      name: String(data.name ?? slug),
      kind: parseKind(data.kind),
      rows: parseRows(data.rows),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }));

export function fitModelById(id: string) {
  if (!id) return undefined;
  return fitModels.find((m) => m.id === id);
}

/** Rows for product page; falls back to legacy `site.sizeChart`. */
export function sizeChartForProduct(fitModelId: string): {
  name: string;
  rows: FitModelRow[];
} {
  const model = fitModelById(fitModelId);
  if (model?.rows.length) {
    return { name: model.name, rows: model.rows };
  }
  return {
    name: "",
    rows: site.sizeChart.map((r) => ({
      size: r.size,
      chest: r.chest,
      length: r.length,
      sleeve: r.sleeve,
    })),
  };
}
