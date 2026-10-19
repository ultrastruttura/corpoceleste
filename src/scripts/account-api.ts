const KEY = "cc-portal-session";

function store() {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

const bc =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("cc-portal-session") : null;

function writeSession(token: string | null, broadcast: boolean) {
  const s = store();
  if (!s) return;
  if (token) s.setItem(KEY, token);
  else s.removeItem(KEY);
  if (broadcast) bc?.postMessage({ type: token ? "set" : "clear", token: token || "" });
}

export function getSession(): string {
  try {
    return store()?.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function setSession(token: string) {
  writeSession(token, true);
}

export function clearSession() {
  writeSession(null, true);
}

/** Other tabs (e.g. admin still open) adopt the session from a magic-link login. */
export function onSessionBroadcast(handler: (token: string | null) => void) {
  if (!bc) return () => {};
  const listener = (ev: MessageEvent) => {
    const data = ev.data as { type?: string; token?: string } | null;
    if (!data || (data.type !== "set" && data.type !== "clear")) return;
    const token = data.type === "set" ? String(data.token || "") : "";
    writeSession(token || null, false);
    handler(token || null);
  };
  bc.addEventListener("message", listener);
  return () => bc.removeEventListener("message", listener);
}

export function apiRoot(el: HTMLElement) {
  return (el.dataset.api || "").replace(/\/$/, "");
}

export async function apiFetch(base: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  // Bearer kept as fallback when third-party cookies are blocked; HttpOnly cookie is primary.
  const session = getSession();
  if (session) headers.set("Authorization", `Bearer ${session}`);
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
