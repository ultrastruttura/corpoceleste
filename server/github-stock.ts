import type { OrderLine } from "./paypal.js";
import { patchStockQty } from "./stock-patch.js";

type GhFile = {
  content: string;
  sha: string;
  path: string;
};

function repo() {
  const full = process.env.GITHUB_REPO || "ultrastruttura/corpoceleste";
  const [owner, name] = full.split("/");
  if (!owner || !name) throw new Error("GITHUB_REPO must be owner/name");
  return { owner, name, branch: process.env.GITHUB_BRANCH || "main" };
}

function token() {
  const t = process.env.GITHUB_TOKEN;
  if (!t) throw new Error("Missing GITHUB_TOKEN");
  return t;
}

async function gh(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return res;
}

export async function ledgerExists(captureId: string): Promise<boolean> {
  const { owner, name, branch } = repo();
  const path = `stock-ledger/${safeId(captureId)}.json`;
  const res = await gh(`/repos/${owner}/${name}/contents/${path}?ref=${encodeURIComponent(branch)}`);
  return res.status === 200;
}

/** Create ledger first (idempotency). Returns false if already processed. */
export async function createLedger(captureId: string, lines: OrderLine[]): Promise<boolean> {
  const { owner, name, branch } = repo();
  const path = `stock-ledger/${safeId(captureId)}.json`;
  const body = {
    message: `stock: mark capture ${safeId(captureId)}`,
    content: Buffer.from(
      JSON.stringify(
        {
          captureId,
          lines,
          at: new Date().toISOString(),
        },
        null,
        2,
      ) + "\n",
      "utf8",
    ).toString("base64"),
    branch,
  };
  const res = await gh(`/repos/${owner}/${name}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (res.status === 201 || res.status === 200) return true;
  if (res.status === 422) return false;
  const text = await res.text();
  throw new Error(`Ledger create failed: ${res.status} ${text}`);
}

export async function applyStockDecrement(lines: OrderLine[]): Promise<string[]> {
  const notes: string[] = [];
  for (const line of lines) {
    const note = await decrementProduct(line);
    if (note) notes.push(note);
  }
  return notes;
}

async function decrementProduct(line: OrderLine): Promise<string | null> {
  const filePath = `content/products/${line.id}.md`;
  const file = await getFile(filePath);
  if (!file) {
    return `missing product ${line.id}`;
  }

  const sizeEsc = line.size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const currentMatch = file.content.match(
    new RegExp(`^([ \\t]+${sizeEsc}:\\s*)(\\d+)\\s*$`, "m"),
  );
  if (!currentMatch) {
    return `no stock line ${line.id} ${line.size}`;
  }
  const before = Math.max(0, Math.floor(Number(currentMatch[2])));
  const after = Math.max(0, before - line.qty);
  const patched = patchStockQty(file.content, line.size, after);
  if (!patched) {
    return `patch failed ${line.id} ${line.size}`;
  }
  if (patched.content !== file.content) {
    await putFile(
      filePath,
      file.sha,
      patched.content,
      `stock: ${line.id} ${line.size} ${before}→${after} (−${line.qty})`,
    );
  }

  if (before < line.qty) {
    return `OVERSELL ${line.id} ${line.size}: aveva ${before}, ordine ×${line.qty} → ${after}`;
  }
  return `${line.id} ${line.size} ${before}→${after}`;
}

async function getFile(path: string): Promise<GhFile | null> {
  const { owner, name, branch } = repo();
  const res = await gh(`/repos/${owner}/${name}/contents/${path}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub get ${path}: ${res.status}`);
  const data = (await res.json()) as { content?: string; encoding?: string; sha?: string; path?: string };
  if (!data.content || !data.sha) return null;
  const content = Buffer.from(data.content, (data.encoding as BufferEncoding) || "base64").toString("utf8");
  return { content, sha: data.sha, path: data.path || path };
}

async function putFile(path: string, sha: string, content: string, message: string) {
  const { owner, name, branch } = repo();
  const res = await gh(`/repos/${owner}/${name}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub put ${path}: ${res.status} ${text}`);
  }
}

function safeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}
