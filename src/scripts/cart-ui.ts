import { artistName, products } from "../data/products";
import {
  changeSize,
  count,
  getCart,
  removeItem,
  setQty,
  total,
  type CartItem,
} from "./cart";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lastFocus: HTMLElement | null = null;
let thumbs: Record<string, string> = {};

function loadThumbs() {
  thumbs = (window as unknown as { __printThumbs?: Record<string, string> }).__printThumbs ?? {};
}

function thumbSrc(print: string) {
  if (!/^[\w.-]+$/.test(print)) return "";
  return thumbs[print] || "";
}

function sizesFor(id: string) {
  return products.find((p) => p.id === id)?.sizes ?? ["S", "M", "L", "XL"];
}

export function lineName(item: CartItem) {
  const p = products.find((x) => x.id === item.id);
  const artist = p ? artistName(p.artistId) : "";
  if (artist && artist !== item.title) return `${artist} · ${item.title}`;
  return item.title;
}

export function renderRecap(root: Element, items: CartItem[], shipping: number) {
  root.replaceChildren();
  let merce = 0;
  for (const item of items) {
    merce += item.price * item.qty;
    const row = el("div", "recap-row");
    row.append(el("span", undefined, `${lineName(item)} · ${item.size} × ${item.qty}`));
    row.append(el("span", undefined, `${item.price * item.qty} €`));
    root.append(row);
  }
  const ship = el("div", "recap-row");
  ship.append(el("span", undefined, "Spedizione"), el("span", undefined, `${shipping} €`));
  root.append(ship);
  const tot = el("div", "recap-row");
  tot.append(el("strong", undefined, "Totale"), el("strong", undefined, `${merce + shipping} €`));
  root.append(tot);
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function lineEl(item: CartItem) {
  const row = el("div", "cart-line");
  row.dataset.id = item.id;
  row.dataset.size = item.size;

  const thumb = el("div", "cart-thumb");
  const src = thumbSrc(item.print);
  if (src) {
    const img = el("img");
    img.src = src;
    img.alt = "";
    img.width = 72;
    img.height = 72;
    thumb.append(img);
  }
  row.append(thumb);

  const meta = el("div");
  meta.append(el("h4", undefined, item.title));

  const select = el("select", "cart-size");
  select.setAttribute("aria-label", `Taglia ${item.title}`);
  select.dataset.changeSize = item.id;
  select.dataset.fromSize = item.size;
  for (const s of sizesFor(item.id)) {
    const opt = el("option", undefined, s);
    opt.value = s;
    if (s === item.size) opt.selected = true;
    select.append(opt);
  }
  meta.append(select);

  const qty = el("div", "cart-qty");
  const minus = el("button", undefined, "−");
  minus.type = "button";
  minus.setAttribute("aria-label", "Diminuisci quantità");
  minus.dataset.qty = "-1";
  const n = el("span", undefined, String(item.qty));
  n.setAttribute("aria-live", "polite");
  const plus = el("button", undefined, "+");
  plus.type = "button";
  plus.setAttribute("aria-label", "Aumenta quantità");
  plus.dataset.qty = "1";
  qty.append(minus, n, plus);
  meta.append(qty);

  const remove = el("button", "cart-remove", "Rimuovi");
  remove.type = "button";
  remove.dataset.remove = item.id;
  remove.dataset.size = item.size;
  meta.append(remove);
  row.append(meta);

  row.append(el("div", undefined, `${item.price * item.qty} €`));
  return row;
}

function renderRoot(root: Element) {
  root.replaceChildren();
  const items = getCart();
  if (!items.length) {
    root.append(el("p", "empty", "Il carrello è vuoto."));
    return;
  }
  for (const item of items) root.append(lineEl(item));
}

export function renderCart() {
  updateBag();
  const drawerLines = document.querySelector("[data-cart-lines]");
  const drawerTotal = document.querySelector("[data-cart-total]");
  const pageLines = document.querySelector("[data-cart-page]");
  const pageTotal = document.querySelector("[data-cart-page-total]");
  const checkoutBtns = document.querySelectorAll<HTMLElement>("[data-cart-checkout]");
  const n = count();
  const sum = n ? `Totale ${total()} €` : "";

  if (drawerLines) renderRoot(drawerLines);
  if (drawerTotal) drawerTotal.textContent = sum;
  if (pageLines) renderRoot(pageLines);
  if (pageTotal) pageTotal.textContent = sum;
  checkoutBtns.forEach((btn) => {
    btn.hidden = n === 0;
  });
}

function updateBag() {
  const n = count();
  document.querySelectorAll("[data-bag-count]").forEach((b) => {
    b.textContent = n ? String(n) : "";
    (b as HTMLElement).dataset.count = String(n);
  });
}

function onCartClick(e: Event) {
  const t = (e.target as HTMLElement).closest<HTMLElement>("[data-remove], [data-qty]");
  if (!t) return;
  const line = t.closest<HTMLElement>(".cart-line");
  if (!line?.dataset.id || !line.dataset.size) return;
  if (t.dataset.remove) {
    removeItem(line.dataset.id, line.dataset.size);
    return;
  }
  if (t.dataset.qty) {
    const item = getCart().find((i) => i.id === line.dataset.id && i.size === line.dataset.size);
    if (!item) return;
    setQty(item.id, item.size, item.qty + Number(t.dataset.qty));
  }
}

function onCartChange(e: Event) {
  const t = e.target as HTMLSelectElement;
  if (!t.dataset.changeSize || !t.dataset.fromSize) return;
  changeSize(t.dataset.changeSize, t.dataset.fromSize, t.value);
}

function focusables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (node) => !node.hasAttribute("disabled") && !node.hidden && !node.closest("[hidden]"),
  );
}

export function openCart() {
  const drawer = document.querySelector<HTMLElement>("[data-cart-drawer]");
  const bg = document.querySelector("[data-cart-bg]");
  if (!drawer) return;
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  drawer.classList.add("is-open");
  bg?.classList.add("is-open");
  drawer.removeAttribute("inert");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  document.querySelector<HTMLElement>("[data-close-cart]")?.focus();
}

export function closeCart() {
  const drawer = document.querySelector<HTMLElement>("[data-cart-drawer]");
  const bg = document.querySelector("[data-cart-bg]");
  if (!drawer) return;
  drawer.classList.remove("is-open");
  bg?.classList.remove("is-open");
  drawer.setAttribute("inert", "");
  drawer.setAttribute("aria-hidden", "true");
  drawer.removeAttribute("aria-modal");
  document.body.classList.remove("cart-open");
  lastFocus?.focus();
  lastFocus = null;
}

function onDrawerKey(e: KeyboardEvent) {
  const drawer = document.querySelector<HTMLElement>("[data-cart-drawer]");
  if (!drawer?.classList.contains("is-open")) return;
  if (e.key === "Escape") {
    e.preventDefault();
    closeCart();
    return;
  }
  if (e.key !== "Tab") return;
  const nodes = focusables(drawer);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function bindRoots() {
  document.querySelectorAll("[data-cart-lines], [data-cart-page]").forEach((root) => {
    root.addEventListener("click", onCartClick);
    root.addEventListener("change", onCartChange);
  });
}

export function bindCart() {
  loadThumbs();
  bindRoots();
  renderCart();

  document.querySelectorAll("[data-open-cart]").forEach((node) => {
    node.addEventListener("click", (e) => {
      e.preventDefault();
      openCart();
    });
  });
  document.querySelector("[data-close-cart]")?.addEventListener("click", closeCart);
  document.querySelector("[data-cart-bg]")?.addEventListener("click", closeCart);
  document.addEventListener("keydown", onDrawerKey);
  window.addEventListener("cart:change", renderCart);

  const drawer = document.querySelector<HTMLElement>("[data-cart-drawer]");
  if (drawer && !drawer.classList.contains("is-open")) {
    drawer.setAttribute("inert", "");
    drawer.setAttribute("aria-hidden", "true");
  }
}
