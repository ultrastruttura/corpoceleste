/** Pure helpers for Apple Pay + PayPal Advanced Checkout hardening. */

export function freezeCheckoutTotal(merchandise: number, shipping: number): string {
  const m = Number(merchandise) || 0;
  const s = Number(shipping) || 0;
  return (m + s).toFixed(2);
}

export function totalsMatch(sheetAmount: string, orderTotal: string): boolean {
  const sheet = String(sheetAmount || "").trim();
  const order = String(orderTotal || "").trim();
  return Boolean(sheet) && Boolean(order) && sheet === order;
}

export type ApplePaySettleDecision =
  | { complete: "success"; redirect: true; reason: "captured" | "confirm_completed" }
  | {
      complete: "failure";
      redirect: false;
      reason: "confirm_failed" | "capture_failed" | "amount_mismatch" | "missing_order";
    };

/**
 * After Apple authorization: only show SUCCESS when money is secured
 * (server capture ok, or confirmOrder already COMPLETED with CAPTURE intent).
 */
export function decideApplePaySettlement(opts: {
  confirmStatus: string;
  captureOk: boolean;
  amountMismatch?: boolean;
  missingOrder?: boolean;
}): ApplePaySettleDecision {
  if (opts.missingOrder) {
    return { complete: "failure", redirect: false, reason: "missing_order" };
  }
  if (opts.amountMismatch) {
    return { complete: "failure", redirect: false, reason: "amount_mismatch" };
  }
  if (opts.captureOk) {
    return { complete: "success", redirect: true, reason: "captured" };
  }
  const st = String(opts.confirmStatus || "").toUpperCase();
  // intent=CAPTURE: confirmOrder may complete payment before our capture POST.
  if (st === "COMPLETED") {
    return { complete: "success", redirect: true, reason: "confirm_completed" };
  }
  return { complete: "failure", redirect: false, reason: "capture_failed" };
}

/** Release stock only when we created a PayPal order and never finished payment. */
export function shouldAbandonPreauthOrder(opts: {
  orderId: string | null | undefined;
  paymentCompleted: boolean;
}): boolean {
  return Boolean(String(opts.orderId || "").trim()) && !opts.paymentCompleted;
}

export function normalizeConfirmStatus(confirmed: unknown): string {
  if (!confirmed || typeof confirmed !== "object") return "";
  return String((confirmed as { status?: string }).status || "").toUpperCase();
}
