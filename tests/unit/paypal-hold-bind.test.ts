import { afterEach, describe, expect, it, vi } from "vitest";

const bindPaypalHold = vi.hoisted(() => vi.fn());

vi.mock("../../server/github-stock.js", () => ({ bindPaypalHold }));

import { bindPaypalCheckoutHold, reservePaypalCheckoutHold } from "../../server/stock/reserve-paypal-checkout";

afterEach(() => {
  vi.unstubAllEnvs();
  bindPaypalHold.mockReset();
});

describe("PayPal checkout hold binding", () => {
  it("rejects a failed ledger write instead of allowing checkout to continue", async () => {
    bindPaypalHold.mockRejectedValueOnce(new Error("ledger unavailable"));
    await expect(bindPaypalCheckoutHold("hold_tmp_1", "ORDER-1")).rejects.toThrow("ledger unavailable");
  });

  it("rejects a missing or released final hold", async () => {
    bindPaypalHold.mockResolvedValueOnce(null).mockResolvedValueOnce({
      kind: "paypal_hold",
      stockComplete: true,
      releasedAt: "2026-01-01T00:00:00.000Z",
    });
    await expect(bindPaypalCheckoutHold("hold_tmp_1", "ORDER-1")).rejects.toThrow("could not be bound");
    await expect(bindPaypalCheckoutHold("hold_tmp_1", "ORDER-1")).rejects.toThrow("could not be bound");
  });

  it("accepts a complete active hold", async () => {
    bindPaypalHold.mockResolvedValueOnce({ kind: "paypal_hold", stockComplete: true });
    await expect(bindPaypalCheckoutHold("hold_tmp_1", "ORDER-1")).resolves.toBeUndefined();
  });

  it("refuses checkout on preview when the stock backend is missing", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    await expect(reservePaypalCheckoutHold([], 10)).resolves.toMatchObject({
      ok: false,
      http: 503,
    });
  });
});
