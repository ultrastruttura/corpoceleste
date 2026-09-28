import { addItem } from "./cart";
import { bindCart, openCart } from "./cart-ui";
import { catalogProduct } from "./catalog";
import { bindNav } from "./nav";

const base = import.meta.env.BASE_URL;

function bind() {
  bindNav();
  bindCart();

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
      if (!p || p.status !== "available") return;
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
