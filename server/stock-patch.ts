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

export function formatShopOrderEmail(opts: {
  captureId: string;
  lines: OrderLine[];
  stockNotes: string[];
  itemLabels?: string[];
  total?: string;
  packlinkRef?: string;
  packlinkLabels?: string[];
  packlinkError?: string;
  shippingAddress?: string;
}): string {
  const rows =
    opts.itemLabels?.length
      ? opts.itemLabels
      : opts.lines.map((l) => `${l.id} · ${l.size} · ×${l.qty}`);
  const packlinkLines: string[] = [];
  if (opts.packlinkRef) packlinkLines.push(`Packlink: ${opts.packlinkRef}`);
  if (opts.packlinkLabels?.length) {
    for (const url of opts.packlinkLabels) packlinkLines.push(`Etichetta: ${url}`);
  }
  if (opts.packlinkError) packlinkLines.push(`Packlink errore: ${opts.packlinkError}`);
  return [
    ...rows,
    "",
    `Capture: ${opts.captureId}`,
    opts.total ? `Totale PayPal: ${opts.total}` : "",
    opts.shippingAddress ? `Spedizione a:\n${opts.shippingAddress}` : "",
    ...packlinkLines,
    "",
    "Magazzino:",
    ...(opts.stockNotes.length ? opts.stockNotes : ["(nessuna variazione)"]),
  ]
    .filter((x) => x !== "")
    .join("\n");
}

export function formatCustomerOrderLines(opts: {
  captureId: string;
  lines: OrderLine[];
  itemLabels?: string[];
  total?: string;
}): string {
  const rows =
    opts.itemLabels?.length
      ? opts.itemLabels
      : opts.lines.map((l) => `${l.id} · ${l.size} · ×${l.qty}`);
  return [
    ...rows,
    "",
    opts.total ? `Totale PayPal: ${opts.total}` : "",
    `Riferimento pagamento: ${opts.captureId}`,
  ]
    .filter((x) => x !== "")
    .join("\n");
}
