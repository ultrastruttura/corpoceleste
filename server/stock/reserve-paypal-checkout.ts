/** Shared PayPal create-order stock hold: release expired → reserve → map errors. */

import { money } from "../order-pricing.js";
import type { OrderLine } from "../../src/lib/paypal-lines.js";

export type ReservePaypalResult =
  | { ok: true; tmpHoldId: string }
  | { ok: false; http: 409 | 503; error: string; detail?: string };

function sanitizeDetail(msg: string): string {
  return msg.replace(/\s+/g, " ").trim().slice(0, 220);
}

export async function releaseExpiredPaypalHoldsBestEffort(): Promise<void> {
  if (!(process.env.GITHUB_TOKEN || "").trim()) return;
  try {
    const { releaseExpiredPaypalHolds } = await import("../github-stock.js");
    await releaseExpiredPaypalHolds();
  } catch (err) {
    console.warn("reserve-paypal: releaseExpiredPaypalHolds", err);
  }
}

export async function reservePaypalCheckoutHold(
  lines: OrderLine[],
  expectedTotal: number,
): Promise<ReservePaypalResult> {
  if (!(process.env.GITHUB_TOKEN || "").trim()) {
    if (process.env.VERCEL_ENV === "production") {
      return { ok: false, http: 503, error: "Stock backend misconfigured" };
    }
    return { ok: true, tmpHoldId: "" };
  }
  const { paypalHoldId, reservePaypalHold, LedgerBusyError, assertGithubStockAccess } =
    await import("../github-stock.js");
  const tmpHoldId = paypalHoldId(`tmp_${crypto.randomUUID()}`);
  try {
    await assertGithubStockAccess();
    await reservePaypalHold(tmpHoldId, lines, {
      expectedTotal: money(expectedTotal),
    });
    return { ok: true, tmpHoldId };
  } catch (err) {
    if (err instanceof LedgerBusyError) {
      return { ok: false, http: 503, error: "Stock busy, retry" };
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("reserve-paypal: stock reserve failed", msg);
    if (
      msg.includes("INSUFFICIENT_STOCK") ||
      msg.startsWith("no stock line") ||
      msg.startsWith("missing product") ||
      msg.startsWith("patch failed")
    ) {
      return { ok: false, http: 409, error: "Out of stock", detail: sanitizeDetail(msg) };
    }
    if (msg.includes("GITHUB_AUTH") || /GitHub put .*: (401|403)/.test(msg)) {
      return {
        ok: false,
        http: 503,
        error: "Stock backend misconfigured",
        detail: sanitizeDetail(msg),
      };
    }
    return {
      ok: false,
      http: 503,
      error: "Stock unavailable, retry",
      detail: sanitizeDetail(msg),
    };
  }
}

export async function abandonPaypalCheckoutHold(tmpHoldId: string): Promise<void> {
  if (!tmpHoldId) return;
  try {
    const { abandonPaypalHold } = await import("../github-stock.js");
    await abandonPaypalHold(tmpHoldId);
  } catch (err) {
    console.error("reserve-paypal: abandon hold failed", err);
  }
}

export async function bindPaypalCheckoutHold(
  tmpHoldId: string,
  paypalOrderId: string,
): Promise<void> {
  if (!tmpHoldId) return;
  try {
    const { bindPaypalHold } = await import("../github-stock.js");
    await bindPaypalHold(tmpHoldId, paypalOrderId);
  } catch (err) {
    console.error("reserve-paypal: bind hold failed", err);
  }
}
