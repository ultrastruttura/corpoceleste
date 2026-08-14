import { addItem, count, getCart, removeItem, total } from "./cart";

const base = import.meta.env.BASE_URL;

function asset(path: string) {
  return `${base}${path.replace(/^\//, "")}`;
}

function renderDrawer() {
  const root = document.querySelector("[data-cart-lines]");
  const totalEl = document.querySelector("[data-cart-total]");
  const badges = document.querySelectorAll("[data-bag-count]");
  const n = count();
  badges.forEach((b) => {
    b.textContent = n ? String(n) : "";
    (b as HTMLElement).dataset.count = String(n);
  });
  if (!root) return;
  const items = getCart();
  if (!items.length) {
    root.innerHTML = `<p class="empty">Il carrello è vuoto.</p>`;
    if (totalEl) totalEl.textContent = "";
    return;
  }
  root.innerHTML = items
    .map(
      (i) => `
      <div class="cart-line">
        <div class="cart-thumb">
          <img src="${asset(`images/prints/${i.print}`)}" alt="" />
        </div>
        <div>
          <h4>${i.title}</h4>
          <p>${i.size} · ${i.qty} × ${i.price} €</p>
          <button class="cart-remove" data-remove="${i.id}" data-size="${i.size}" type="button">Rimuovi</button>
        </div>
        <div>${i.price * i.qty} €</div>
      </div>`
    )
    .join("");
  if (totalEl) totalEl.textContent = `Totale ${total()} €`;
}

function openCart() {
  document.querySelector("[data-cart-drawer]")?.classList.add("is-open");
  document.querySelector("[data-cart-bg]")?.classList.add("is-open");
}

function closeCart() {
  document.querySelector("[data-cart-drawer]")?.classList.remove("is-open");
  document.querySelector("[data-cart-bg]")?.classList.remove("is-open");
}

function shuffleGrid() {
  const grid = document.querySelector("[data-product-grid]");
  if (!grid) return;
  const cards = [...grid.querySelectorAll<HTMLElement>("[data-product]")];
  const news = cards.filter((c) => c.dataset.nuovo === "1" && c.dataset.status === "available");
  const rest = cards.filter((c) => c.dataset.nuovo !== "1" && c.dataset.status === "available");
  const sold = cards.filter((c) => c.dataset.status === "soldout");
  const seedKey = "cc-shuffle";
  let seed = Number(sessionStorage.getItem(seedKey));
  if (!seed) {
    seed = Date.now();
    sessionStorage.setItem(seedKey, String(seed));
  }
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  [...news, ...rest, ...sold].forEach((c) => grid.append(c));
}

function bind() {
  renderDrawer();
  shuffleGrid();

  document.querySelectorAll<HTMLInputElement>("[data-next-grazie]").forEach((el) => {
    el.value = `${location.origin}${base}grazie/`;
  });

  document.querySelector("[data-menu-toggle]")?.addEventListener("click", () => {
    document.querySelector("[data-mobile-nav]")?.classList.toggle("is-open");
    document.body.classList.toggle("nav-open");
  });

  document.querySelectorAll("[data-open-cart]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openCart();
    });
  });
  document.querySelector("[data-close-cart]")?.addEventListener("click", closeCart);
  document.querySelector("[data-cart-bg]")?.addEventListener("click", closeCart);

  document.querySelector("[data-cart-lines]")?.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-remove]");
    if (!t) return;
    removeItem(t.dataset.remove!, t.dataset.size!);
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

  window.addEventListener("cart:change", renderDrawer);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
else bind();
