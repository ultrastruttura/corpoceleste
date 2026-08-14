const KEY = "corpoceleste-cart";

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

export function clearCart() {
  write([]);
}
