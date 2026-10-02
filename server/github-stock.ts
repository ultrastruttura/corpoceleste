import type { OrderLine } from "./paypal.js";
import { patchStockQty } from "./stock-patch.js";

type GhFile = {
  content: string;
  sha: string;
  path: string;
};

export type LedgerStatus = "pending" | "done" | "failed";

export type LedgerRecord = {
  captureId: string;
  lines: OrderLine[];
  status: LedgerStatus;
  at: string;
  stockNotes?: string[];
  emailed?: boolean;
  error?: string;
  expectedTotal?: string;
  paidTotal?: string;
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

function safeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}

function ledgerPath(captureId: string) {
  return `stock-ledger/${safeId(captureId)}.json`;
}

export async function getRepoFile(path: string): Promise<GhFile | null> {
  const { owner, name, branch } = repo();
  const res = await gh(`/repos/${owner}/${name}/contents/${path}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub get ${path}: ${res.status}`);
  const data = (await res.json()) as { content?: string; encoding?: string; sha?: string; path?: string };
  if (!data.content || !data.sha) return null;
  const content = Buffer.from(data.content, (data.encoding as BufferEncoding) || "base64").toString("utf8");
  return { content, sha: data.sha, path: data.path || path };
}

async function putRepoFile(path: string, sha: string | undefined, content: string, message: string) {
  const { owner, name, branch } = repo();
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await gh(`/repos/${owner}/${name}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub put ${path}: ${res.status} ${text}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
}

export async function getLedger(captureId: string): Promise<LedgerRecord | null> {
  const file = await getRepoFile(ledgerPath(captureId));
  if (!file) return null;
  try {
    const data = JSON.parse(file.content) as LedgerRecord;
    if (!data.status) data.status = "done";
    return data;
  } catch {
    return { captureId, lines: [], status: "done", at: new Date().toISOString() };
  }
}

/**
 * Claim idempotency slot or resume incomplete work.
 * - done → skip
 * - pending/failed → resume
 * - missing → create pending
 */
export async function claimOrResumeLedger(
  captureId: string,
  lines: OrderLine[],
  meta?: { expectedTotal?: string; paidTotal?: string },
): Promise<{ action: "skip" | "process"; ledger: LedgerRecord }> {
  const existing = await getLedger(captureId);
  if (existing?.status === "done") {
    return { action: "skip", ledger: existing };
  }
  if (existing && (existing.status === "pending" || existing.status === "failed")) {
    return { action: "process", ledger: existing };
  }

  const ledger: LedgerRecord = {
    captureId,
    lines,
    status: "pending",
    at: new Date().toISOString(),
    emailed: false,
    ...meta,
  };
  const path = ledgerPath(captureId);
  const body = JSON.stringify(ledger, null, 2) + "\n";
  try {
    await putRepoFile(path, undefined, body, `stock: claim capture ${safeId(captureId)}`);
    return { action: "process", ledger };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 422) {
      const again = await getLedger(captureId);
      if (again?.status === "done") return { action: "skip", ledger: again };
      if (again) return { action: "process", ledger: again };
    }
    throw err;
  }
}

export async function writeLedger(ledger: LedgerRecord): Promise<void> {
  const path = ledgerPath(ledger.captureId);
  const file = await getRepoFile(path);
  const body = JSON.stringify(ledger, null, 2) + "\n";
  await putRepoFile(
    path,
    file?.sha,
    body,
    `stock: ${ledger.status} capture ${safeId(ledger.captureId)}`,
  );
}

export async function applyStockDecrement(lines: OrderLine[]): Promise<string[]> {
  const notes: string[] = [];
  for (const line of lines) {
    const note = await decrementProduct(line);
    notes.push(note);
  }
  return notes;
}

async function decrementProduct(line: OrderLine): Promise<string> {
  const filePath = `content/products/${line.id}.md`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const file = await getRepoFile(filePath);
      if (!file) {
        throw new Error(`missing product ${line.id}`);
      }

      const sizeEsc = line.size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const currentMatch = file.content.match(
        new RegExp(`^([ \\t]+${sizeEsc}:\\s*)(\\d+)\\s*$`, "m"),
      );
      if (!currentMatch) {
        throw new Error(`no stock line ${line.id} ${line.size}`);
      }
      const before = Math.max(0, Math.floor(Number(currentMatch[2])));
      if (before < line.qty) {
        throw new Error(
          `INSUFFICIENT_STOCK ${line.id} ${line.size}: aveva ${before}, ordine ×${line.qty}`,
        );
      }
      const after = before - line.qty;
      const patched = patchStockQty(file.content, line.size, after);
      if (!patched) {
        throw new Error(`patch failed ${line.id} ${line.size}`);
      }
      if (patched.content !== file.content) {
        await putRepoFile(
          filePath,
          file.sha,
          patched.content,
          `stock: ${line.id} ${line.size} ${before}→${after} (−${line.qty})`,
        );
      }
      return `${line.id} ${line.size} ${before}→${after}`;
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith("INSUFFICIENT_STOCK") || msg.startsWith("missing product") || msg.startsWith("no stock")) {
        throw err;
      }
      if (status === 409 || /409/.test(msg)) {
        await sleep(150 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @deprecated use getLedger / claimOrResumeLedger */
export async function ledgerExists(captureId: string): Promise<boolean> {
  return Boolean(await getLedger(captureId));
}

/** @deprecated use claimOrResumeLedger */
export async function createLedger(captureId: string, lines: OrderLine[]): Promise<boolean> {
  const result = await claimOrResumeLedger(captureId, lines);
  return result.action === "process" && result.ledger.status === "pending" && !result.ledger.stockNotes;
}
