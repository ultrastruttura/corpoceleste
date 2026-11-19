import { describe, expect, it } from "vitest";
import { paypalOrderIsCaptured, type PayPalOrder } from "../../server/paypal";

describe("paypalOrderIsCaptured", () => {
  it("accepts top-level COMPLETED", () => {
    expect(paypalOrderIsCaptured({ status: "COMPLETED" })).toBe(true);
  });

  it("accepts nested capture COMPLETED", () => {
    const order: PayPalOrder = {
      status: "APPROVED",
      purchase_units: [{ payments: { captures: [{ status: "COMPLETED" }] } }],
    };
    expect(paypalOrderIsCaptured(order)).toBe(true);
  });

  it("rejects APPROVED without captures", () => {
    expect(paypalOrderIsCaptured({ status: "APPROVED" })).toBe(false);
  });
});
