export function bindNav() {
  const btn = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const nav = document.querySelector<HTMLElement>("[data-mobile-nav]");
  if (!btn || !nav) return;

  const syncTop = () => {
    const chrome = document.querySelector<HTMLElement>(".site-chrome");
    if (!chrome) return;
    const announce = chrome.querySelector<HTMLElement>(".site-announce");
    const header = chrome.querySelector<HTMLElement>(".header");
    const h =
      (announce?.getBoundingClientRect().height ?? 0) +
      (header?.getBoundingClientRect().height ?? 0);
    nav.style.top = `${Math.round(h)}px`;
  };

  const setOpen = (open: boolean) => {
    syncTop();
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

  window.addEventListener("resize", syncTop, { passive: true });
  syncTop();
  setOpen(false);
}
