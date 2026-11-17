import { describe, expect, it } from "vitest";
import { stockNoteMutated } from "../../server/github-stock";
import { applyTinaStockDelta } from "../../server/stock/runtime-stock";

/** Pure helpers mirroring consume/restore clamp rules. */
function nextConsume(before: number, qty: number, allowOversell: boolean) {
  if (!allowOversell && before < qty) return null;
  return allowOversell ? Math.max(0, before - qty) : before - qty;
}

describe("runtime stock consume rules", () => {
  it("blocks available oversell", () => {
    expect(nextConsume(2, 3, false)).toBeNull();
    expect(nextConsume(5, 2, false)).toBe(3);
  });

  it("clamps preorder oversell at zero", () => {
    expect(nextConsume(1, 3, true)).toBe(0);
    expect(nextConsume(4, 1, true)).toBe(3);
  });

  it("stockNoteMutated skips preorder no-ops", () => {
    expect(stockNoteMutated("tee M 5→4")).toBe(true);
    expect(stockNoteMutated("shopper unica preorder 0→0 (turso)")).toBe(false);
    expect(stockNoteMutated("shopper unica preorder (magazzino 3, non scalato)")).toBe(false);
    expect(stockNoteMutated("shopper unica preorder 3→2 (turso)")).toBe(true);
  });

  it("applyTinaStockDelta keeps sales when Tina restocks or cuts", () => {
    // Sold 2 from Tina 10 → live 8, base 10; Tina restock to 15 → live 13
    expect(applyTinaStockDelta(8, 10, 15)).toEqual({ qty: 13, tinaBase: 15, changed: true });
    // Tina cut 10 → 6 after 2 sold (live 8) → live 4
    expect(applyTinaStockDelta(8, 10, 6)).toEqual({ qty: 4, tinaBase: 6, changed: true });
    // No Tina change
    expect(applyTinaStockDelta(8, 10, 10)).toEqual({ qty: 8, tinaBase: 10, changed: false });
    // Never negative
    expect(applyTinaStockDelta(1, 10, 5)).toEqual({ qty: 0, tinaBase: 5, changed: true });
    // Legacy row (no base): adopt Tina, keep live
    expect(applyTinaStockDelta(8, null, 10)).toEqual({ qty: 8, tinaBase: 10, changed: true });
  });
});
