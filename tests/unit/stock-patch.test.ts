import { describe, expect, it } from "vitest";
import { patchStockQty } from "../../server/stock-patch";

describe("patchStockQty", () => {
  it("updates nested stock qty", () => {
    const md = `---
title: Test
stock:
  S: 5
  M: 3
---
body
`;
    const out = patchStockQty(md, "M", 1);
    expect(out?.before).toBe(3);
    expect(out?.content).toContain("M: 1");
    expect(out?.content).toContain("S: 5");
  });

  it("is a no-op when qty unchanged", () => {
    const md = `---
stock:
  M: 2
---
`;
    const out = patchStockQty(md, "M", 2);
    expect(out?.before).toBe(2);
    expect(out?.content).toBe(md);
  });

  it("returns null for missing size", () => {
    const md = `---
stock:
  S: 1
---
`;
    expect(patchStockQty(md, "XXL", 0)).toBeNull();
  });
});
