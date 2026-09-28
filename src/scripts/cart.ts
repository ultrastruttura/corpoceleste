import { catalogProduct } from "./catalog";

const KEY = "corpoceleste-cart";
export const LAST_ORDER_KEY = "cc-last-order";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  size: string;
  qty: number;
  color: string;
  print: string;
};

export type OrderSnapshot = {
  items: CartItem[];
  shipping: number;
  total: number;
};

function read(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:change"));
}

/** Drop sold-out / unknown lines and force list prices from the built catalog. */
export function sanitizeCart() {
  const raw = read();
  const merged = new Map<string, CartItem>();

  for (const item of raw) {
    const p = catalogProduct(item.id);
    if (!p || p.status !== "available") continue;
    const size = p.sizes.includes(item.size) ? item.size : p.sizes[0];
    if (!size) continue;
    const qty = Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 1)));
    const key = `${p.id}::${size}`;
    const prev = merged.get(key);
    if (prev) {
      prev.qty = Math.min(99, prev.qty + qty);
      continue;
    }
    merged.set(key, {
      id: p.id,
      slug: item.slug || p.id,
      title: p.title,
      price: p.price,
      size,
      qty,
      color: item.color || "",
      print: p.print || item.print || "",
    });
  }

  const next = [...merged.values()];
  const changed = JSON.stringify(raw) !== JSON.stringify(next);
  if (changed) write(next);
  return next;
}

export function getCart() {
  return sanitizeCart();
}

export function count() {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

export function total() {
  return getCart().reduce((n, i) => n + i.price * i.qty, 0);
}

export function addItem(item: Omit<CartItem, "qty" | "price" | "title"> & { qty?: number; price?: number; title?: string }) {
  const p = catalogProduct(item.id);
  if (!p || p.status !== "available") return false;
  const size = p.sizes.includes(item.size) ? item.size : p.sizes[0];
  if (!size) return false;

  const items = sanitizeCart();
  const i = items.findIndex((x) => x.id === p.id && x.size === size);
  const qty = Math.max(1, Math.min(99, Math.floor(item.qty ?? 1)));
  if (i >= 0) items[i].qty = Math.min(99, items[i].qty + qty);
  else {
    items.push({
      id: p.id,
      slug: item.slug || p.id,
      title: p.title,
      price: p.price,
      size,
      qty,
      color: item.color || "",
      print: p.print || item.print || "",
    });
  }
  write(items);
  return true;
}

export function removeItem(id: string, size: string) {
  write(sanitizeCart().filter((x) => !(x.id === id && x.size === size)));
}

export function setQty(id: string, size: string, qty: number) {
  const q = Math.max(0, Math.min(99, Math.floor(qty)));
  if (q < 1) {
    removeItem(id, size);
    return;
  }
  const items = sanitizeCart();
  const i = items.findIndex((x) => x.id === id && x.size === size);
  if (i < 0) return;
  items[i].qty = q;
  write(items);
}

export function changeSize(id: string, from: string, to: string) {
  if (from === to) return;
  const p = catalogProduct(id);
  if (!p || !p.sizes.includes(to)) return;
  const items = sanitizeCart();
  const i = items.findIndex((x) => x.id === id && x.size === from);
  if (i < 0) return;
  const j = items.findIndex((x) => x.id === id && x.size === to);
  if (j >= 0) {
    items[j].qty = Math.min(99, items[j].qty + items[i].qty);
    items.splice(i, 1);
  } else {
    items[i].size = to;
  }
  write(items);
}

export function clearCart() {
  write([]);
}

export function saveOrderSnapshot(shipping: number) {
  const items = sanitizeCart();
  const merce = items.reduce((n, i) => n + i.price * i.qty, 0);
  const snap: OrderSnapshot = { items, shipping, total: merce + shipping };
  sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(snap));
}

export function readOrderSnapshot(): OrderSnapshot | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrderSnapshot;
  } catch {
    return null;
  }
}
