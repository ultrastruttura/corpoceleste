import type { OrderLine } from "./paypal.js";
import { patchStockQty } from "./stock-patch.js";

type GhFile = {
  content: string;
  sha: string;
  path: string;
};

export type LedgerStatus = "pending" | "processing" | "done" | "failed";

export type LedgerRecord = {
  captureId: string;
  lines: OrderLine[];
  status: LedgerStatus;
  at: string;
  stockNotes?: string[];
  /** Keys `id:size:qty` already decremented — resume must not re-apply these. */
  stockAppliedKeys?: string[];
  /** True only after every line is decremented and checkpointed. */
  stockComplete?: boolean;
  emailed?: boolean;
  error?: string;
  expectedTotal?: string;
  paidTotal?: string;
  packlinkRef?: string;
  packlinkLabels?: string[];
  packlinkError?: string;
  packlinkServiceId?: string | number;
};

export function stockLineKey(line: OrderLine): string {
  return `${line.id}:${line.size}:${line.qty}`;
}

/** Lines not yet checkpointed as decremented (supports legacy stockNotes-only ledgers). */
export function remainingStockLines(lines: OrderLine[], ledger: LedgerRecord): OrderLine[] {
  const keys = new Set(ledger.stockAppliedKeys || []);
  if (!keys.size && ledger.stockNotes?.length) {
    for (const line of lines) {
      const prefix = `${line.id} ${line.size} `;
      if (ledger.stockNotes.some((n) => n.startsWith(prefix))) {
        keys.add(stockLineKey(line));
      }
    }
  }
  if (ledger.stockComplete && !keys.size) return [];
  return lines.filter((l) => !keys.has(stockLineKey(l)));
}

/** Another webhook delivery is mid-flight (soft lock via ledger status). */
export class LedgerBusyError extends Error {
  constructor(captureId: string) {
    super(`Ledger busy for capture ${captureId}`);
    this.name = "LedgerBusyError";
  }
}

/** Stock decrement failed after some lines already applied. */
export class StockPartialError extends Error {
  appliedNotes: string[];
  constructor(message: string, appliedNotes: string[]) {
    super(message);
    this.name = "StockPartialError";
    this.appliedNotes = appliedNotes;
  }
}

const PROCESSING_STALE_MS = 120_000;

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

/** Only stock-ledger + product markdown — never arbitrary repo paths. */
function assertWritableRepoPath(path: string) {
  const p = path.replace(/^\/+/, "");
  if (p.includes("..") || p.includes("\\")) {
    throw new Error(`Refusing unsafe GitHub path: ${path}`);
  }
  if (p.startsWith("stock-ledger/") && p.endsWith(".json")) return;
  if (p.startsWith("content/products/") && p.endsWith(".md")) return;
  throw new Error(`Refusing GitHub write outside allowlist: ${path}`);
}

export async function getRepoFile(path: string): Promise<GhFile | null> {
  assertWritableRepoPath(path);
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
  assertWritableRepoPath(path);
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

function ledgerAgeMs(ledger: LedgerRecord) {
  const t = Date.parse(ledger.at);
  return Number.isFinite(t) ? Date.now() - t : Number.POSITIVE_INFINITY;
}

/**
 * Claim idempotency slot or resume incomplete work.
 * - done → skip
 * - young processing → busy (caller should 5xx so PayPal retries)
 * - pending/failed/stale processing → mark processing and continue
 * - missing → create processing
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
  if (existing?.status === "processing" && ledgerAgeMs(existing) < PROCESSING_STALE_MS) {
    throw new LedgerBusyError(captureId);
  }

  const path = ledgerPath(captureId);
  const ledger: LedgerRecord = {
    ...(existing || { captureId, lines, emailed: false }),
    captureId,
    lines: existing?.lines?.length ? existing.lines : lines,
    status: "processing",
    at: new Date().toISOString(),
    ...meta,
  };
  // Keep progress fields from existing resume.
  if (existing?.stockNotes?.length) ledger.stockNotes = existing.stockNotes;
  if (existing?.stockAppliedKeys?.length) ledger.stockAppliedKeys = existing.stockAppliedKeys;
  if (existing?.stockComplete) ledger.stockComplete = existing.stockComplete;
  if (existing?.packlinkRef) ledger.packlinkRef = existing.packlinkRef;
  if (existing?.packlinkLabels) ledger.packlinkLabels = existing.packlinkLabels;
  if (existing?.packlinkError) ledger.packlinkError = existing.packlinkError;
  if (existing?.packlinkServiceId != null) ledger.packlinkServiceId = existing.packlinkServiceId;
  if (existing?.emailed) ledger.emailed = existing.emailed;

  const body = JSON.stringify(ledger, null, 2) + "\n";
  try {
    const file = existing ? await getRepoFile(path) : null;
    await putRepoFile(
      path,
      file?.sha,
      body,
      `stock: claim processing ${safeId(captureId)}`,
    );
    return { action: "process", ledger };
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 409 || status === 422) {
      const again = await getLedger(captureId);
      if (again?.status === "done") return { action: "skip", ledger: again };
      if (again?.status === "processing" && ledgerAgeMs(again) < PROCESSING_STALE_MS) {
        throw new LedgerBusyError(captureId);
      }
      if (again) return { action: "process", ledger: again };
    }
    throw err;
  }
}

export async function writeLedger(ledger: LedgerRecord): Promise<void> {
  const path = ledgerPath(ledger.captureId);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const file = await getRepoFile(path);
      const body = JSON.stringify(ledger, null, 2) + "\n";
      await putRepoFile(
        path,
        file?.sha,
        body,
        `stock: ${ledger.status} capture ${safeId(ledger.captureId)}`,
      );
      return;
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      if (status === 409) {
        await sleep(100 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function applyStockDecrement(lines: OrderLine[]): Promise<string[]> {
  const notes: string[] = [];
  try {
    for (const line of lines) {
      const note = await decrementProduct(line);
      notes.push(note);
    }
    return notes;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new StockPartialError(msg, notes);
  }
}

/**
 * Decrement remaining lines with a ledger checkpoint after each line so PayPal
 * retries never re-decrement applied keys and can finish partial carts.
 */
export async function applyStockDecrementCheckpointed(
  ledger: LedgerRecord,
  lines: OrderLine[],
  persist: (next: LedgerRecord) => Promise<void>,
): Promise<LedgerRecord> {
  let working: LedgerRecord = {
    ...ledger,
    stockNotes: [...(ledger.stockNotes || [])],
    stockAppliedKeys: [...(ledger.stockAppliedKeys || [])],
  };

  // Hydrate keys from legacy notes-only ledgers.
  if (!working.stockAppliedKeys?.length && working.stockNotes?.length) {
    const keys: string[] = [];
    for (const line of lines) {
      const prefix = `${line.id} ${line.size} `;
      if (working.stockNotes.some((n) => n.startsWith(prefix))) {
        keys.push(stockLineKey(line));
      }
    }
    working.stockAppliedKeys = keys;
  }

  if (working.stockComplete) return working;

  const remaining = remainingStockLines(lines, working);
  if (!remaining.length) {
    working = {
      ...working,
      stockComplete: true,
      status: "processing",
      at: new Date().toISOString(),
    };
    await persist(working);
    return working;
  }

  for (const line of remaining) {
    try {
      const note = await decrementProduct(line);
      const stockNotes = [...(working.stockNotes || []), note];
      const stockAppliedKeys = [...(working.stockAppliedKeys || []), stockLineKey(line)];
      working = {
        ...working,
        status: "processing",
        stockNotes,
        stockAppliedKeys,
        error: undefined,
        at: new Date().toISOString(),
      };
      await persist(working);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      working = {
        ...working,
        status: "failed",
        error: msg,
        at: new Date().toISOString(),
      };
      await persist(working);
      throw new StockPartialError(msg, working.stockNotes || []);
    }
  }

  working = {
    ...working,
    stockComplete: true,
    status: "processing",
    error: undefined,
    at: new Date().toISOString(),
  };
  await persist(working);
  return working;
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
      if (
        msg.startsWith("INSUFFICIENT_STOCK") ||
        msg.startsWith("missing product") ||
        msg.startsWith("no stock") ||
        msg.startsWith("patch failed")
      ) {
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
  return result.action === "process" && result.ledger.status === "processing" && !result.ledger.stockNotes;
}
