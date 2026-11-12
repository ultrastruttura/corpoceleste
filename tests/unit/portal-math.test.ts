import { describe, expect, it } from "vitest";
import { computeShare } from "../../server/portal/math";

describe("computeShare", () => {
  it("computes VAT, costs, and artist share from gross", () => {
    const result = computeShare({
      sales: [{ qty: 2, unit_price: 45 }],
      costs: [
        { label: "blank", amount: 8, per_unit: true },
        { label: "setup", amount: 20, per_unit: false },
      ],
      planned_qty: 10,
      artist_share_pct: 50,
      vat_rate_pct: 22,
    });
    expect(result.gross).toBe(90);
    expect(result.vat).toBe(19.8);
    expect(result.variable).toBe(16);
    expect(result.fixedAllocated).toBe(4);
    expect(result.costsTotal).toBe(20);
    expect(result.profit).toBe(50.2);
    expect(result.artistDue).toBe(25.1);
    expect(result.studioShare).toBe(25.1);
  });
});
