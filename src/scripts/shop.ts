import { isPurchasableStatus } from "../lib/product-status";
import { bindAutoplayVideos } from "./autoplay-video";
import { addItem } from "./cart";
import { applyLiveStock, catalogProduct, hydrateCatalog } from "./catalog";
import { bindNav } from "./nav";

const base = import.meta.env.BASE_URL;

/** Browser-safe: do not import data/commerce (pulls gray-matter → Buffer). */
function commerceApiBase() {
  return (document.documentElement.dataset.api || "").replace(/\/$/, "");
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
    if (data.products?.length) applyLiveStock(data.products);
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
  const mod = await ensureCartUi();
  if (!stockSynced) {
    stockSynced = true;
    await refreshLiveStock();
  }
  mod.renderCart();
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

  // Early cart click before idle: start loading cart-ui immediately.
  document.addEventListener(
    "pointerdown",
    (e) => {
      const el = e.target as Element | null;
      if (!el?.closest("[data-open-cart], [data-cart-drawer], [data-cart-bg], [data-add-form]")) return;
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
