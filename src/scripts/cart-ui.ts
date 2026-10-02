import { ui } from "../i18n/dict";
import { currentLocale } from "../i18n/runtime";
import {
  catalogMaxQty,
  catalogProduct,
  catalogProducts,
  catalogSizeInStock,
  catalogStock,
} from "./catalog";
import {
  changeSize,
  count,
  getCart,
  removeItem,
  setQty,
  total,
  type CartItem,
} from "./cart";

function copy() {
  return ui[currentLocale(document.documentElement.lang)];
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lastFocus: HTMLElement | null = null;

function thumbSrc(print: string) {
  if (!print) return "";
  if (/^https?:\/\//i.test(print)) return print;
  const clean = print.replace(/^\//, "");
  const file = clean.split("/").pop() || "";
  const stem = file.replace(/\.[^.]+$/, "");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (stem && clean.includes("uploads/prints/")) {
    return `${base}/uploads/prints/card/${stem}.jpg`;
  }
  if (print.startsWith("/")) return `${base}${print}`;
  return "";
}

function sizesFor(id: string) {
  return catalogProducts().find((p) => p.id === id)?.sizes ?? ["S", "M", "L", "XL"];
}

export function lineName(item: CartItem) {
  const p = catalogProducts().find((x) => x.id === item.id);
  const artist = p?.artistName ?? "";
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
  const labels = copy();
  const ship = el("div", "recap-row");
  ship.append(el("span", undefined, labels.cart.shipping), el("span", undefined, `${shipping} €`));
  root.append(ship);
  const tot = el("div", "recap-row");
  tot.append(el("strong", undefined, labels.cart.totalLabel), el("strong", undefined, `${merce + shipping} €`));
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
    img.alt = catalogProduct(item.id)?.imageAlt || item.title;
    img.width = 72;
    img.height = 72;
    thumb.append(img);
  }
  row.append(thumb);

  const meta = el("div");
  meta.append(el("h4", undefined, item.title));

  const labels = copy();
  const product = catalogProduct(item.id);
  const sizeField = el("fieldset", "cart-sizes");
  const legend = el("legend", "visually-hidden", labels.cart.sizeOf(item.title));
  sizeField.append(legend);
  const sizeRow = el("div", "cart-size-row");

  for (const s of sizesFor(item.id)) {
    const inStock = product ? catalogSizeInStock(product, s) : false;
    const stock = product ? catalogStock(product, s) : 0;
    const label = el("label", inStock ? undefined : "is-oos");
    const input = el("input") as HTMLInputElement;
    input.type = "radio";
    input.name = `cart-size-${item.id}-${item.size}`;
    input.value = s;
    input.checked = s === item.size;
    input.disabled = !inStock && s !== item.size;
    input.dataset.changeSize = item.id;
    input.dataset.fromSize = item.size;
    if (!inStock && s === item.size) {
      // Current line kept only if catalog still has stock; if not, mark clearly.
      input.disabled = true;
    }

    const text = el("span");
    if (!inStock) {
      text.append(document.createTextNode(`${s} · ${labels.product.sizeOut}`));
    } else {
      text.append(document.createTextNode(s));
      if (stock <= 3) {
        const hint = el("span", "cart-size-left", ` · ${labels.product.stockLeft(stock)}`);
        text.append(hint);
      }
    }
    label.append(input, text);
    sizeRow.append(label);
  }
  sizeField.append(sizeRow);
  meta.append(sizeField);

  if (product && !catalogSizeInStock(product, item.size)) {
    meta.append(el("p", "cart-line-warn", labels.cart.sizeUnavailable));
  }

  const max = product ? catalogMaxQty(product, item.size) : item.qty;
  const qty = el("div", "cart-qty");
  const minus = el("button", undefined, "−");
  minus.type = "button";
  minus.setAttribute("aria-label", labels.cart.qtyDown);
  minus.dataset.qty = "-1";
  const n = el("span", undefined, String(item.qty));
  n.setAttribute("aria-live", "polite");
  const plus = el("button", undefined, "+");
  plus.type = "button";
  plus.setAttribute("aria-label", labels.cart.qtyUp);
  plus.dataset.qty = "1";
  if (item.qty >= max) plus.disabled = true;
  qty.append(minus, n, plus);
  meta.append(qty);

  const remove = el("button", "cart-remove", labels.cart.remove);
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
    root.append(el("p", "empty", copy().cart.empty));
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
  const sum = n ? copy().cart.total(total()) : "";

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
  const t = e.target as HTMLInputElement | HTMLSelectElement;
  if (!t.dataset.changeSize || !t.dataset.fromSize) return;
  if (t instanceof HTMLInputElement && t.type === "radio" && !t.checked) return;
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
