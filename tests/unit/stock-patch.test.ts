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

  it("updates flat stockS", () => {
    const md = `---
title: Tee
stockS: 10
stockM: 4
---
`;
    const out = patchStockQty(md, "M", 2);
    expect(out?.before).toBe(4);
    expect(out?.content).toContain("stockM: 2");
    expect(out?.content).toContain("stockS: 10");
  });

  it("updates flat stockQty for one-size products", () => {
    const md = `---
title: Shopper
kind: shopper
stockQty: 12
---
`;
    const out = patchStockQty(md, "unica", 9);
    expect(out?.before).toBe(12);
    expect(out?.content).toContain("stockQty: 9");
  });
});
