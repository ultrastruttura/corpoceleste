import { describe, expect, it } from "vitest";
import {
  catalogInStock,
  catalogIsLowStock,
  catalogTotalStock,
  type CatalogProduct,
} from "../../src/scripts/catalog";

function shirt(stock: Record<string, number>, status: CatalogProduct["status"] = "available"): CatalogProduct {
  return {
    id: "tee",
    title: "Tee",
    artistName: "A",
    kind: "shirt",
    sizes: ["S", "M", "L"],
    stock,
    price: 40,
    status,
    print: "",
    imageAlt: "",
  };
}

describe("catalog stock UI helpers", () => {
  it("sums all sizes for low-stock threshold", () => {
    const p = shirt({ S: 1, M: 2, L: 2 });
    expect(catalogTotalStock(p)).toBe(5);
    expect(catalogIsLowStock(p, 5)).toBe(true);
    expect(catalogIsLowStock(p, 4)).toBe(false);
  });

  it("sold out when no size has stock", () => {
    const p = shirt({ S: 0, M: 0, L: 0 });
    expect(catalogInStock(p)).toBe(false);
    expect(catalogIsLowStock(p, 5)).toBe(false);
  });

  it("preorder stays in stock even at zero", () => {
    const p = shirt({ S: 0, M: 0, L: 0 }, "preorder");
    expect(catalogInStock(p)).toBe(true);
  });
});
