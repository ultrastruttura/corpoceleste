import { describe, expect, it } from "vitest";
import {
  decideApplePaySettlement,
  freezeCheckoutTotal,
  normalizeConfirmStatus,
  shouldAbandonPreauthOrder,
  totalsMatch,
} from "../../src/lib/apple-pay-checkout";

describe("freezeCheckoutTotal", () => {
  it("formats merchandise + shipping to 2 decimals", () => {
    expect(freezeCheckoutTotal(40, 5.5)).toBe("45.50");
    expect(freezeCheckoutTotal(10, 0)).toBe("10.00");
  });
});

describe("totalsMatch", () => {
  it("requires exact string equality", () => {
    expect(totalsMatch("45.50", "45.50")).toBe(true);
    expect(totalsMatch("45.50", "45.5")).toBe(false);
    expect(totalsMatch("", "45.50")).toBe(false);
  });
});

describe("decideApplePaySettlement", () => {
  it("succeeds when server capture ok", () => {
    expect(
      decideApplePaySettlement({ confirmStatus: "APPROVED", captureOk: true }),
    ).toEqual({ complete: "success", redirect: true, reason: "captured" });
  });

  it("succeeds when confirm already COMPLETED even if capture POST failed", () => {
    expect(
      decideApplePaySettlement({ confirmStatus: "COMPLETED", captureOk: false }),
    ).toEqual({ complete: "success", redirect: true, reason: "confirm_completed" });
  });

  it("fails when neither capture nor COMPLETED confirm", () => {
    expect(
      decideApplePaySettlement({ confirmStatus: "APPROVED", captureOk: false }),
    ).toEqual({ complete: "failure", redirect: false, reason: "capture_failed" });
  });

  it("fails on amount mismatch / missing order", () => {
    expect(
      decideApplePaySettlement({
        confirmStatus: "",
        captureOk: false,
        amountMismatch: true,
      }),
    ).toMatchObject({ complete: "failure", reason: "amount_mismatch" });
    expect(
      decideApplePaySettlement({
        confirmStatus: "",
        captureOk: false,
        missingOrder: true,
      }),
    ).toMatchObject({ complete: "failure", reason: "missing_order" });
  });
});

describe("shouldAbandonPreauthOrder", () => {
  it("abandons only unpaid pending orders", () => {
    expect(shouldAbandonPreauthOrder({ orderId: "ABC", paymentCompleted: false })).toBe(true);
    expect(shouldAbandonPreauthOrder({ orderId: "ABC", paymentCompleted: true })).toBe(false);
    expect(shouldAbandonPreauthOrder({ orderId: "", paymentCompleted: false })).toBe(false);
  });
});

describe("normalizeConfirmStatus", () => {
  it("uppercases status from confirm payload", () => {
    expect(normalizeConfirmStatus({ status: "completed" })).toBe("COMPLETED");
    expect(normalizeConfirmStatus(null)).toBe("");
  });
});
