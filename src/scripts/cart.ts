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

export function getCart() {
  return read();
}

export function count() {
  return read().reduce((n, i) => n + i.qty, 0);
}

export function total() {
  return read().reduce((n, i) => n + i.price * i.qty, 0);
}

export function addItem(item: Omit<CartItem, "qty"> & { qty?: number }) {
  const items = read();
  const i = items.findIndex((x) => x.id === item.id && x.size === item.size);
  if (i >= 0) items[i].qty += item.qty ?? 1;
  else items.push({ ...item, qty: item.qty ?? 1 });
  write(items);
}

export function removeItem(id: string, size: string) {
  write(read().filter((x) => !(x.id === id && x.size === size)));
}

export function setQty(id: string, size: string, qty: number) {
  const q = Math.max(0, Math.min(99, Math.floor(qty)));
  if (q < 1) {
    removeItem(id, size);
    return;
  }
  const items = read();
  const i = items.findIndex((x) => x.id === id && x.size === size);
  if (i < 0) return;
  items[i].qty = q;
  write(items);
}

export function changeSize(id: string, from: string, to: string) {
  if (from === to) return;
  const items = read();
  const i = items.findIndex((x) => x.id === id && x.size === from);
  if (i < 0) return;
  const j = items.findIndex((x) => x.id === id && x.size === to);
  if (j >= 0) {
    items[j].qty += items[i].qty;
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
  const items = read();
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
