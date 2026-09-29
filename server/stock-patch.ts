import type { OrderLine } from "./paypal.js";

/** Surgical stock patch: only rewrite `  SIZE: N` inside the `stock:` block. */
export function patchStockQty(
  markdown: string,
  size: string,
  nextQty: number,
): { content: string; before: number } | null {
  const qty = Math.max(0, Math.floor(nextQty));
  const sizeRe = size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const front = fm[1];
  const stockMatch = front.match(/(^|\n)(stock:\r?\n)((?:[ \t]+[^\r\n]*\r?\n)*)/);
  if (!stockMatch) return null;

  const stockBody = stockMatch[3];
  const lineRe = new RegExp(`^([ \\t]+${sizeRe}:\\s*)(\\d+)\\s*$`, "m");
  const lineMatch = stockBody.match(lineRe);
  if (!lineMatch) return null;

  const before = Math.floor(Number(lineMatch[2]));
  if (!Number.isFinite(before)) return null;
  if (before === qty) return { content: markdown, before };

  const newStockBody = stockBody.replace(lineRe, `$1${qty}`);
  const newFront = front.replace(stockMatch[0], `${stockMatch[1]}${stockMatch[2]}${newStockBody}`);
  const content = markdown.replace(fm[0], `---\n${newFront}\n---`);
  return { content, before };
}

export function formatOrderEmail(opts: {
  captureId: string;
  lines: OrderLine[];
  stockNotes: string[];
  itemLabels?: string[];
  total?: string;
}): string {
  const rows =
    opts.itemLabels?.length
      ? opts.itemLabels
      : opts.lines.map((l) => `${l.id} · ${l.size} · ×${l.qty}`);
  const site = (process.env.SITE_URL || "https://ultrastruttura.github.io/corpoceleste").replace(/\/$/, "");
  const parts = [
    "Conferma d'ordine — Corpoceleste",
    `Data e ora: ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`,
    "",
    ...rows,
    "",
    `Capture: ${opts.captureId}`,
    opts.total ? `Totale PayPal: ${opts.total}` : "",
    "",
    "Hai 14 giorni dalla consegna per recedere senza motivo.",
    `Recesso online: ${site}/recesso/`,
    `Condizioni di vendita, resi e garanzia legale di 2 anni: ${site}/vendita/`,
    "",
    "— interno —",
    "Magazzino:",
    ...(opts.stockNotes.length ? opts.stockNotes : ["(nessuna variazione)"]),
  ].filter((x) => x !== "");
  return parts.join("\n");
}
