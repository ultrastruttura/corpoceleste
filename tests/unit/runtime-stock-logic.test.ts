import { describe, expect, it } from "vitest";

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
});
