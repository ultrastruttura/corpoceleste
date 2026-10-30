/**
 * Portal session: HttpOnly cookie on the API host is the source of truth.
 * We do NOT store the session token in sessionStorage (XSS-exfiltratable).
 * A boolean flag only syncs “logged in” UX across tabs.
 */
const FLAG = "cc-portal-on";
const LEGACY_KEY = "cc-portal-session";

function store() {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

const bc =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("cc-portal-session") : null;

function writeFlag(on: boolean, broadcast: boolean) {
  const s = store();
  if (s) {
    if (on) s.setItem(FLAG, "1");
    else s.removeItem(FLAG);
    try {
      s.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }
  if (broadcast) bc?.postMessage({ type: on ? "set" : "clear" });
}

/** True if this tab believes the user logged in (cookie still required for API). */
export function hasSession(): boolean {
  try {
    return store()?.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

/** @deprecated Token is cookie-only; always returns "". */
export function getSession(): string {
  return "";
}

export function setSession(_token?: string) {
  writeFlag(true, true);
}

export function clearSession() {
  writeFlag(false, true);
}

/** Other tabs re-boot when login/logout happens. */
export function onSessionBroadcast(handler: (_authed: boolean) => void) {
  if (!bc) return () => {};
  const listener = (ev: MessageEvent) => {
    const data = ev.data as { type?: string } | null;
    if (!data || (data.type !== "set" && data.type !== "clear")) return;
    const on = data.type === "set";
    writeFlag(on, false);
    handler(on);
  };
  bc.addEventListener("message", listener);
  return () => bc.removeEventListener("message", listener);
}

export function apiRoot(el: HTMLElement) {
  return (el.dataset.api || "").replace(/\/$/, "");
}

export async function apiFetch(base: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const method = String(init.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  // Cookie (HttpOnly) via credentials — no Bearer token in JS.
  const res = await fetch(`${base}/api/account/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || res.statusText);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return data;
}

export function money(n: number) {
  return `${Number(n).toFixed(2)} €`;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Safe: text + optional same-origin / https link (no innerHTML). */
export function setMsg(
  node: HTMLElement,
  text: string,
  link?: { href: string; label: string },
) {
  node.hidden = false;
  node.replaceChildren();
  node.append(document.createTextNode(text));
  if (link?.href) {
    node.append(document.createTextNode(" "));
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    a.rel = "noopener noreferrer";
    node.append(a);
  }
}
