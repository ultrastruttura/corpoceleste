import { describe, expect, it } from "vitest";
import {
  encodeOrderLines,
  encodeSku,
  mergeOrderLines,
  parseOrderLines,
  parseSku,
} from "../../src/lib/paypal-lines";

describe("mergeOrderLines", () => {
  it("merges duplicate id+size and caps qty", () => {
    expect(
      mergeOrderLines(
        [
          { id: "tee", size: "M", qty: 2 },
          { id: "tee", size: "M", qty: 3 },
          { id: "tee", size: "L", qty: 1 },
        ],
        { maxQty: 4 },
      ),
    ).toEqual([
      { id: "tee", size: "M", qty: 4 },
      { id: "tee", size: "L", qty: 1 },
    ]);
  });

  it("drops lines missing id or size; coerces qty below 1 up to 1", () => {
    expect(mergeOrderLines([{ id: "", size: "M", qty: 1 }])).toEqual([]);
    expect(mergeOrderLines([{ id: "x", size: "", qty: 2 }])).toEqual([]);
    expect(mergeOrderLines([{ id: "x", size: "M", qty: 0 }])).toEqual([
      { id: "x", size: "M", qty: 1 },
    ]);
  });
});

describe("encode/parse order lines", () => {
  it("round-trips lines", () => {
    const lines = [
      { id: "non-scegli-la-tua-casa", size: "M", qty: 1 },
      { id: "tee", size: "XL", qty: 2 },
    ];
    expect(parseOrderLines(encodeOrderLines(lines))).toEqual(lines);
  });

  it("handles empty and garbage", () => {
    expect(parseOrderLines("")).toEqual([]);
    expect(parseOrderLines("bad")).toEqual([]);
  });
});

describe("SKU", () => {
  it("encodes and parses product::size", () => {
    expect(encodeSku("tee", "M")).toBe("tee::M");
    expect(parseSku("tee::M")).toEqual({ id: "tee", size: "M" });
    expect(parseSku("bad")).toBeNull();
  });
});
