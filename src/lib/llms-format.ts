/** Pure formatting helpers for llms.txt / llms-full.txt (no Astro / CMS loaders). */

export function note(text: string) {
  return text.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

export function stripMarkdownLinks(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/** Drop shared handmade disclaimer block from product body (stated once globally). */
export function productBodyForAgents(raw: string) {
  const cut = raw.split(
    /UN PAIO DI COSE DA TENERE IN CONSIDERAZIONE|A FEW THINGS TO KEEP IN MIND|EIN PAAR HINWEISE/i,
  )[0];
  return note(stripMarkdownLinks(cut || raw));
}

export function clipText(text: string, max: number) {
  const t = note(text);
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export type ProductFactBits = {
  kindLabel: string;
  colorLabel: string;
  compositionLabel: string;
  sizesLabel: string;
  colorName?: string;
  composition?: string;
  sizes?: string[];
  hasSizes?: boolean;
  artist?: string;
  title: string;
  price?: number;
  statusLabel: string;
};

export function formatProductFacts(bits: ProductFactBits) {
  const out: string[] = [bits.kindLabel];
  if (bits.colorName?.trim()) out.push(`${bits.colorLabel} ${bits.colorName.trim()}`);
  if (bits.composition?.trim()) out.push(`${bits.compositionLabel} ${bits.composition.trim()}`);
  if (bits.hasSizes && bits.sizes?.length) {
    out.push(`${bits.sizesLabel} ${bits.sizes.join("–")}`);
  }
  if (bits.artist && bits.artist !== bits.title) out.push(bits.artist);
  if (bits.price != null && Number.isFinite(bits.price) && bits.price > 0) {
    out.push(`${bits.price} €`);
  }
  out.push(bits.statusLabel);
  return out.filter(Boolean).join(" · ");
}

export function formatProductBlurb(opts: {
  seo: string;
  description: string;
  facts: string;
  max?: number;
}) {
  const max = opts.max ?? 280;
  const seo = note(opts.seo);
  if (seo) return clipText(seo, max);
  const body = productBodyForAgents(opts.description);
  if (body) return clipText(body, max);
  return opts.facts;
}
