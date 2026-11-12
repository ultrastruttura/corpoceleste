import { describe, expect, it } from "vitest";
import {
  paypalHoldId,
  remainingStockLines,
  stockLineKey,
  type LedgerRecord,
} from "../../server/github-stock";

const lines = [
  { id: "tee", size: "M", qty: 1 },
  { id: "tee", size: "L", qty: 2 },
];

function ledger(partial: Partial<LedgerRecord>): LedgerRecord {
  return {
    captureId: "cap_1",
    lines,
    status: "processing",
    at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("stock line checkpoints", () => {
  it("builds stable keys", () => {
    expect(stockLineKey(lines[0])).toBe("tee:M:1");
    expect(paypalHoldId("ORDER-1")).toBe("hold_ORDER-1");
  });

  it("returns all lines when nothing applied yet", () => {
    expect(remainingStockLines(lines, ledger({}))).toEqual(lines);
  });

  it("skips lines already in stockAppliedKeys (retry / second webhook)", () => {
    const left = remainingStockLines(
      lines,
      ledger({ stockAppliedKeys: ["tee:M:1"] }),
    );
    expect(left).toEqual([{ id: "tee", size: "L", qty: 2 }]);
  });

  it("returns empty when stockComplete and keys cover the order", () => {
    expect(
      remainingStockLines(
        lines,
        ledger({
          stockComplete: true,
          stockAppliedKeys: ["tee:M:1", "tee:L:2"],
        }),
      ),
    ).toEqual([]);
  });

  it("treats stockComplete with no keys as fully applied (legacy)", () => {
    expect(remainingStockLines(lines, ledger({ stockComplete: true }))).toEqual([]);
  });

  it("infers applied lines from legacy stockNotes prefixes", () => {
    const left = remainingStockLines(
      lines,
      ledger({
        stockNotes: ["tee M 5→4"],
      }),
    );
    expect(left).toEqual([{ id: "tee", size: "L", qty: 2 }]);
  });

  it("simulates double capture: second pass has nothing left to decrement", () => {
    let state = ledger({ stockAppliedKeys: [], stockComplete: false });
    const firstPass = remainingStockLines(lines, state);
    expect(firstPass).toHaveLength(2);

    // First webhook applies all lines then checkpoints.
    state = {
      ...state,
      stockAppliedKeys: firstPass.map(stockLineKey),
      stockComplete: true,
      status: "done",
    };

    const secondPass = remainingStockLines(lines, state);
    expect(secondPass).toEqual([]);
  });
});
