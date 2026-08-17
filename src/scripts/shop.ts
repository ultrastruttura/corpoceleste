import { addItem } from "./cart";
import { bindCart, openCart } from "./cart-ui";
import { bindNav } from "./nav";

const base = import.meta.env.BASE_URL;

function bind() {
  bindNav();
  bindCart();

  document.querySelectorAll<HTMLInputElement>("[data-next-grazie]").forEach((node) => {
    const from = node.getAttribute("data-next-grazie") || "form";
    node.value = `${location.origin}${base}grazie/?from=${encodeURIComponent(from)}`;
  });

  document.querySelectorAll<HTMLFormElement>("[data-add-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      addItem({
        id: String(fd.get("id")),
        slug: String(fd.get("slug")),
        title: String(fd.get("title")),
        price: Number(fd.get("price")),
        size: String(fd.get("size") || "M"),
        color: String(fd.get("color")),
        print: String(fd.get("print")),
      });
      openCart();
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
else bind();
