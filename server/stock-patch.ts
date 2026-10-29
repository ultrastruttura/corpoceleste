import type { OrderLine } from "./paypal.js";

/**
 * Match a stock qty line: `  SIZE: N`, `  "SIZE": N`, or `  'SIZE': N`.
 * Groups: 1=indent, 2=key+colon+spaces, 3=qty.
 */
export function stockQtyLineRe(size: string): RegExp {
  const sizeEsc = size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Use [ \t] not \s — in JS \s includes \n and would eat the line break before the next FM key.
  return new RegExp(
    `^([ \\t]+)((?:"${sizeEsc}"|'${sizeEsc}'|${sizeEsc}):[ \\t]*)(\\d+)[ \\t]*$`,
    "m",
  );
}

/** Surgical stock patch: only rewrite size qty inside the `stock:` block. */
export function patchStockQty(
  markdown: string,
  size: string,
  nextQty: number,
): { content: string; before: number } | null {
  const qty = Math.max(0, Math.floor(nextQty));
  // Tina / Windows saves may include UTF-8 BOM and CRLF.
  const source = markdown.replace(/^\uFEFF/, "");

  const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const front = fm[1];
  // Last stock line may lack a trailing newline when it is the final frontmatter field.
  const stockMatch = front.match(
    /(^|\r?\n)(stock:\r?\n)((?:[ \t]+[^\r\n]*\r?\n)*(?:[ \t]+[^\r\n]*)?)/,
  );
  if (!stockMatch) return null;

  const stockBody = stockMatch[3];
  const lineRe = stockQtyLineRe(size);
  const lineMatch = stockBody.match(lineRe);
  if (!lineMatch) return null;

  const before = Math.floor(Number(lineMatch[3]));
  if (!Number.isFinite(before)) return null;
  if (before === qty) {
    return { content: markdown, before };
  }

  const newStockBody = stockBody.replace(lineRe, `$1$2${qty}`);
  const newFront = front.replace(stockMatch[0], `${stockMatch[1]}${stockMatch[2]}${newStockBody}`);
  const patchedFm = `---\n${newFront}\n---`;
  // Preserve original BOM if present; normalize only the replaced frontmatter fence newlines.
  const bom = markdown.startsWith("\uFEFF") ? "\uFEFF" : "";
  const content = bom + source.replace(fm[0], patchedFm);
  return { content, before };
}

export function formatShopOrderEmail(opts: {
  captureId: string;
  lines: OrderLine[];
  stockNotes: string[];
  itemLabels?: string[];
  total?: string;
  merchandise?: string;
  shippingCost?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  if (opts.packlinkRef) packlinkLines.push(`Sendcloud: ${opts.packlinkRef}`);
  if (opts.packlinkLabels?.length) {
    for (const url of opts.packlinkLabels) packlinkLines.push(`Etichetta: ${url}`);
  }
  if (opts.packlinkError) packlinkLines.push(`Sendcloud errore: ${opts.packlinkError}`);
  const address = String(opts.shippingAddress || "").trim();
  return [
    "Nuovo ordine PayPal",
    "",
    ...rows,
    "",
    opts.customerEmail ? `Email cliente: ${opts.customerEmail}` : "",
    opts.customerPhone ? `Telefono: ${opts.customerPhone}` : "",
    address ? `Indirizzo:\n${address}` : "Indirizzo: (non restituito da PayPal)",
    "",
    opts.merchandise ? `Merce: ${opts.merchandise}` : "",
    opts.shippingCost != null && opts.shippingCost !== ""
      ? `Spedizione: ${opts.shippingCost}`
      : "",
    opts.total ? `Totale: ${opts.total}` : "",
    `Capture: ${opts.captureId}`,
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
  locale?: string;
}): string {
  const rows =
    opts.itemLabels?.length
      ? opts.itemLabels
      : opts.lines.map((l) => `${l.id} · ${l.size} · ×${l.qty}`);
  const [totalLabel, refLabel] =
    opts.locale === "en"
      ? ["PayPal total", "Payment reference"]
      : opts.locale === "de"
        ? ["PayPal-Summe", "Zahlungsreferenz"]
        : ["Totale PayPal", "Riferimento pagamento"];
  return [
    ...rows,
    "",
    opts.total ? `${totalLabel}: ${opts.total}` : "",
    `${refLabel}: ${opts.captureId}`,
  ]
    .filter((x) => x !== "")
    .join("\n");
}
