export type OrderLine = { id: string; size: string; qty: number };

/** Merge duplicate id+size lines; optional per-line qty ceiling. */
export function mergeOrderLines(
  lines: OrderLine[],
  opts?: { maxQty?: number },
): OrderLine[] {
  const maxQty = opts?.maxQty;
  const map = new Map<string, OrderLine>();
  for (const line of lines) {
    const id = String(line.id || "").trim();
    const size = String(line.size || "").trim();
    let qty = Math.max(1, Math.floor(Number(line.qty) || 0));
    if (!id || !size || qty < 1) continue;
    if (maxQty != null) qty = Math.min(maxQty, qty);
    const key = `${id}::${size}`;
    const prev = map.get(key);
    if (prev) {
      prev.qty = maxQty != null ? Math.min(maxQty, prev.qty + qty) : prev.qty + qty;
    } else {
      map.set(key, { id, size, qty });
    }
  }
  return [...map.values()];
}

/** Encode cart lines for PayPal custom_id (max 127 chars). */
export function encodeOrderLines(lines: OrderLine[]): string {
  return lines
    .map((l) => `${l.id}:${l.size}:${Math.max(1, Math.floor(l.qty))}`)
    .join("|")
    .slice(0, 127);
}

export function parseOrderLines(raw: string): OrderLine[] {
  if (!raw.trim()) return [];
  const out: OrderLine[] = [];
  for (const part of raw.split("|")) {
    const bits = part.split(":");
    if (bits.length < 3) continue;
    const qty = Math.floor(Number(bits[bits.length - 1]));
    const size = bits[bits.length - 2];
    const id = bits.slice(0, -2).join(":");
    if (!id || !size || !Number.isFinite(qty) || qty < 1) continue;
    out.push({ id, size, qty });
  }
  return out;
}

/** SKU on PayPal line items: productId::size */
export function encodeSku(id: string, size: string) {
  return `${id}::${size}`.slice(0, 127);
}

export function parseSku(sku: string): { id: string; size: string } | null {
  const i = sku.lastIndexOf("::");
  if (i <= 0) return null;
  const id = sku.slice(0, i).trim();
  const size = sku.slice(i + 2).trim();
  if (!id || !size) return null;
  return { id, size };
}
