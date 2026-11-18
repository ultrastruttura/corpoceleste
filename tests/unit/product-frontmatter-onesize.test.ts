import { describe, expect, it } from "vitest";
import {
  ONE_SIZE,
  isSizedKind,
  parseProductFrontmatter,
} from "../../src/lib/product-frontmatter";

describe("parseProductFrontmatter one-size kinds", () => {
  it("maps stockQty to unica for shopper", () => {
    const core = parseProductFrontmatter({
      title: "Bag",
      kind: "shopper",
      price: 20,
      status: "available",
      stockQty: 7,
      sizes: ["S", "M"],
      stockS: 99,
    });
    expect(isSizedKind("shopper")).toBe(false);
    expect(core.sizes).toEqual([ONE_SIZE]);
    expect(core.stock).toEqual({ [ONE_SIZE]: 7 });
  });

  it("keeps S–XXL stock for shirts", () => {
    const core = parseProductFrontmatter({
      title: "Tee",
      kind: "shirt",
      price: 40,
      status: "available",
      sizes: ["S", "M"],
      stockS: 3,
      stockM: 5,
    });
    expect(isSizedKind("shirt")).toBe(true);
    expect(core.sizes).toEqual(["S", "M"]);
    expect(core.stock).toEqual({ S: 3, M: 5 });
  });

  it("sorts garment sizes S→XXL even if Tina YAML is shuffled", () => {
    const core = parseProductFrontmatter({
      title: "Tee",
      kind: "shirt",
      price: 20,
      status: "preorder",
      sizes: ["M", "L", "XL", "XXL", "S"],
      stockS: 1,
      stockM: 1,
      stockL: 1,
      stockXL: 1,
      stockXXL: 1,
    });
    expect(core.sizes).toEqual(["S", "M", "L", "XL", "XXL"]);
  });
});
