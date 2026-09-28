export function bindNav() {
  const btn = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const nav = document.querySelector<HTMLElement>("[data-mobile-nav]");
  if (!btn || !nav) return;

  const setOpen = (open: boolean) => {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", String(open));
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!nav.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    const t = e.target as Node;
    if (nav.contains(t) || btn.contains(t)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !nav.classList.contains("is-open")) return;
    if (document.querySelector("[data-cart-drawer]")?.classList.contains("is-open")) return;
    setOpen(false);
    btn.focus();
  });

  setOpen(false);
}
