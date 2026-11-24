import { isPurchasableStatus } from "../lib/product-status";
import { bindAutoplayVideos } from "./autoplay-video";
import { addItem } from "./cart";
import {
  applyLiveStock,
  catalogInStock,
  catalogIsLowStock,
  catalogProduct,
  catalogSizeInStock,
  hydrateCatalog,
} from "./catalog";
import { bindNav } from "./nav";

const base = import.meta.env.BASE_URL;

/** Browser-safe: do not import data/commerce (pulls gray-matter → Buffer). */
function commerceApiBase() {
  return (document.documentElement.dataset.api || "").replace(/\/$/, "");
}

function lowStockThreshold() {
  const n = Number(document.documentElement.dataset.lowStockThreshold);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 5;
}

/** Reflect live stock on product-page size radios (SSR HTML is build-time). */
function syncProductSizeUi() {
  document.querySelectorAll<HTMLFormElement>("[data-add-form]").forEach((form) => {
    const id = String(form.querySelector<HTMLInputElement>('input[name="id"]')?.value || "");
    const p = catalogProduct(id);
    if (!p) return;
    const radios = [
      ...form.querySelectorAll<HTMLInputElement>('input[type="radio"][name="size"]'),
    ];
    let needReselect = false;
    for (const input of radios) {
      const available = catalogSizeInStock(p, input.value);
      input.disabled = !available;
      const label = input.closest("label");
      label?.classList.toggle("is-oos", !available);
      if (label) label.hidden = false;
      if (!available && input.checked) {
        input.checked = false;
        needReselect = true;
      }
    }
    if (needReselect) {
      const next = radios.find((r) => !r.disabled);
      if (next) next.checked = true;
    }
  });
}

/** Home/shop cards: sold / low-stock / preorder badges from live totals. */
function syncProductCardUi() {
  const threshold = lowStockThreshold();
  const root = document.documentElement.dataset;
  const soldLabel = root.badgeSold || "Esaurito";
  const lowLabel = root.badgeLowStock || "In esaurimento";
  const preorderLabel = root.badgePreorder || "Pre-order";

  document.querySelectorAll<HTMLElement>("[data-product-id]").forEach((card) => {
    const id = card.dataset.productId || "";
    const p = catalogProduct(id);
    if (!p) return;

    const sold = !catalogInStock(p);
    const low = !sold && catalogIsLowStock(p, threshold);
    const preorder = p.status === "preorder" && !sold && !low;

    card.classList.toggle("is-sold", sold);
    card.classList.toggle("is-low-stock", low);
    card.classList.toggle("is-preorder", preorder);
    card.dataset.status = p.status;

    const frame = card.querySelector(".card-frame");
    if (!frame) return;
    frame.querySelectorAll(".badge").forEach((el) => el.remove());
    if (sold || low || preorder) {
      const badge = document.createElement("span");
      badge.className = sold ? "badge" : "badge badge--quiet";
      badge.textContent = sold ? soldLabel : low ? lowLabel : preorderLabel;
      frame.insertBefore(badge, frame.firstChild);
    }
  });
}

function syncLiveStockUi() {
  syncProductSizeUi();
  syncProductCardUi();
}

async function refreshLiveStock() {
  const api = commerceApiBase();
  if (!api) return;
  try {
    const res = await fetch(`${api}/api/live-stock`, {
      credentials: "omit",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      products?: Array<{
        id: string;
        stock: Record<string, number>;
        status?: string;
        price?: number;
      }>;
    };
    if (data.products?.length) {
      applyLiveStock(data.products);
      syncLiveStockUi();
    }
  } catch {
    /* keep build-time catalog */
  }
}

type CartUi = typeof import("./cart-ui");

let cartUiPromise: Promise<CartUi> | null = null;
let cartBound = false;
let stockSynced = false;

function loadCartUi() {
  if (!cartUiPromise) cartUiPromise = import("./cart-ui");
  return cartUiPromise;
}

async function ensureCartUi() {
  const mod = await loadCartUi();
  if (!cartBound) {
    mod.bindCart();
    cartBound = true;
  }
  return mod;
}

/** cart-ui + live-stock are not needed for first paint / LCP — load after idle. */
async function bootShopChrome() {
  const already = cartBound && stockSynced;
  const mod = await ensureCartUi();
  // Avoid re-render on every drawer tap — that destroys qty/size controls mid-click.
  if (!already) mod.renderCart();
  // Never block cart/checkout UI on live-stock (can take several seconds).
  if (!stockSynced) {
    stockSynced = true;
    void refreshLiveStock().then(() => mod.renderCart());
  }
}

function whenIdle(fn: () => void) {
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") {
    ric(() => fn(), { timeout: 2500 });
  } else {
    window.setTimeout(fn, 1);
  }
}

function bind() {
  hydrateCatalog();
  bindNav();
  bindAutoplayVideos();

  document.querySelectorAll<HTMLFormElement>(".newsletter-form").forEach((form) => {
    const consent = form.querySelector<HTMLInputElement>("[data-newsletter-consent]");
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!consent || !submit) return;
    const sync = () => {
      submit.disabled = !consent.checked;
    };
    consent.addEventListener("change", sync);
    sync();
  });

  document.querySelectorAll<HTMLInputElement>("[data-next-grazie]").forEach((node) => {
    const from = node.getAttribute("data-next-grazie") || "form";
    const prefix = document.documentElement.dataset.localePrefix || "";
    node.value = `${location.origin}${base}${prefix}grazie/?from=${encodeURIComponent(from)}`;
  });

  document.querySelectorAll<HTMLFormElement>("[data-add-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      void (async () => {
        const fd = new FormData(form);
        const id = String(fd.get("id") || "");
        const p = catalogProduct(id);
        if (!p || !isPurchasableStatus(p.status)) return;
        const ok = addItem({
          id,
          slug: String(fd.get("slug") || id),
          size: String(fd.get("size") || p.sizes[0] || "M"),
          color: String(fd.get("color") || ""),
          print: p.print,
        });
        if (!ok) return;
        const { openCart, renderCart } = await ensureCartUi();
        renderCart();
        openCart();
        void refreshLiveStock().then(() => renderCart());
      })();
    });
  });

  // Prefetch cart UI only when opening the bag or adding — never on drawer controls
  // (+/− / taglie / rimuovi): those pointerdowns used to re-render and cancel the click.
  document.addEventListener(
    "pointerdown",
    (e) => {
      const el = e.target as Element | null;
      if (!el?.closest("[data-open-cart], [data-add-form]")) return;
      void bootShopChrome();
    },
    { capture: true, passive: true },
  );

  // Cart page needs lines ASAP; elsewhere keep cart-ui + live-stock off the LCP path.
  if (document.querySelector("[data-cart-page]")) {
    void bootShopChrome();
  } else {
    whenIdle(() => {
      void bootShopChrome();
    });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
else bind();
