import { apiFetch, apiRoot, clearSession, setSession } from "./account-api";

function readMagicToken() {
  const hash = location.hash.replace(/^#/, "");
  const fromHash = new URLSearchParams(hash).get("t");
  if (fromHash) return fromHash;
  // Legacy query links (?t=) still work once, then we strip them.
  return new URLSearchParams(location.search).get("t") || "";
}

function scrubUrl() {
  const url = new URL(location.href);
  url.hash = "";
  url.searchParams.delete("t");
  history.replaceState(null, "", url.pathname + url.search);
}

function showStatus(status: Element | null, text: string, homeHref: string) {
  if (!status) return;
  status.textContent = "";
  status.append(document.createTextNode(text + " "));
  const a = document.createElement("a");
  a.href = homeHref;
  a.textContent = "Area personale";
  status.append(a);
}

const root = document.querySelector<HTMLElement>("[data-account-auth]");
if (root) {
  const base = apiRoot(root);
  const status = root.querySelector("[data-auth-status]");
  const prefix = document.documentElement.dataset.localePrefix || "";
  const home = `${import.meta.env.BASE_URL}${prefix}account/`.replace(/\/{2,}/g, "/");
  const homeHref = home.endsWith("/") ? home : `${home}/`;
  const token = readMagicToken();
  scrubUrl();

  (async () => {
    if (!base) {
      if (status) status.textContent = "API non configurata.";
      return;
    }
    if (!token) {
      showStatus(status, "Link mancante.", homeHref);
      return;
    }
    try {
      const data = (await apiFetch(base, "auth", {
        method: "POST",
        body: JSON.stringify({ action: "verify", token }),
      })) as { session?: string };
      if (!data.session) throw new Error("Sessione non creata");
      setSession(data.session);
      if (status) status.textContent = "Accesso riuscito. Reindirizzo…";
      location.replace(homeHref);
    } catch (err) {
      clearSession();
      const text =
        err instanceof Error ? err.message : "Link non valido. Richiedi un nuovo accesso.";
      showStatus(status, text, homeHref);
    }
  })();
}
