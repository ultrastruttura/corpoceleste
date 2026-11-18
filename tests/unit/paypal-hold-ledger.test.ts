import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  getHold: vi.fn(),
  putHold: vi.fn(),
}));

vi.mock("../../server/stock/hold-store.js", () => ({
  holdStoreActive: () => true,
  getHold: store.getHold,
  putHold: store.putHold,
  createHold: vi.fn(),
  listExpiredOpenHolds: vi.fn(),
  listOpenBankHolds: vi.fn(),
}));

import { bindPaypalHold, type LedgerRecord } from "../../server/github-stock";

const tmp: LedgerRecord = {
  captureId: "hold_tmp_1",
  kind: "paypal_hold",
  status: "done",
  at: "2026-01-01T00:00:00.000Z",
  lines: [{ id: "tee", size: "M", qty: 1 }],
  stockComplete: true,
};

beforeEach(() => {
  store.getHold.mockReset();
  store.putHold.mockReset();
  store.getHold.mockResolvedValue(tmp);
  store.putHold.mockResolvedValue(undefined);
});

describe("PayPal ledger binding", () => {
  it("closes the temporary hold before creating the final hold", async () => {
    await bindPaypalHold(tmp.captureId, "ORDER-1");
    expect(store.putHold).toHaveBeenCalledTimes(2);
    expect(store.putHold.mock.calls[0][0]).toMatchObject({
      captureId: tmp.captureId,
      consumedBy: "hold_ORDER-1",
    });
    expect(store.putHold.mock.calls[1][0]).toMatchObject({
      captureId: "hold_ORDER-1",
      stockComplete: true,
    });
  });

  it("does not create the final hold if closing the temporary hold fails", async () => {
    store.putHold.mockRejectedValueOnce(new Error("temporary hold write failed"));
    await expect(bindPaypalHold(tmp.captureId, "ORDER-1")).rejects.toThrow("temporary hold write failed");
    expect(store.putHold).toHaveBeenCalledTimes(1);
  });
});
