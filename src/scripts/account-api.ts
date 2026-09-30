const KEY = "cc-portal-session";

function store() {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function getSession(): string {
  try {
    return store()?.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function setSession(token: string) {
  store()?.setItem(KEY, token);
}

export function clearSession() {
  store()?.removeItem(KEY);
}

export function apiRoot(el: HTMLElement) {
  return (el.dataset.api || "").replace(/\/$/, "");
}

export async function apiFetch(base: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const session = getSession();
  if (session) headers.set("Authorization", `Bearer ${session}`);
  const res = await fetch(`${base}/api/account/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
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
