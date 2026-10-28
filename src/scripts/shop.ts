import { isPurchasableStatus } from "../lib/product-status";
import { bindAutoplayVideos } from "./autoplay-video";
import { addItem } from "./cart";
import { bindCart, openCart, renderCart } from "./cart-ui";
import { applyLiveStock, catalogProduct } from "./catalog";
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

function bind() {
  bindNav();
  bindCart();
  bindAutoplayVideos();
  void refreshLiveStock().then(() => renderCart());

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
      if (ok) openCart();
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
else bind();
