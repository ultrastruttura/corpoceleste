/** Shared PayPal create-order stock hold: release expired → reserve → map errors. */

import { money } from "../order-pricing.js";
import type { OrderLine } from "../../src/lib/paypal-lines.js";

export type ReservePaypalResult =
  | { ok: true; tmpHoldId: string }
  | { ok: false; http: 409 | 503; error: string };

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
    return { ok: true, tmpHoldId: "" };
  }
  const { paypalHoldId, reservePaypalHold, LedgerBusyError } = await import(
    "../github-stock.js"
  );
  const tmpHoldId = paypalHoldId(`tmp_${crypto.randomUUID()}`);
  try {
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
    if (msg.includes("INSUFFICIENT_STOCK")) {
      return { ok: false, http: 409, error: "Out of stock" };
    }
    return { ok: false, http: 503, error: "Stock unavailable, retry" };
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
