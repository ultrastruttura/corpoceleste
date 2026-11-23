import { describe, expect, it } from "vitest";
import { fitModelIdFromRef } from "../../src/data/fit-models";

describe("fitModelIdFromRef", () => {
  it("extracts id from Tina content path", () => {
    expect(fitModelIdFromRef("content/fit-models/longsleeve-gl2400-cotone-205gr.md")).toBe(
      "longsleeve-gl2400-cotone-205gr",
    );
  });

  it("returns empty for missing ref", () => {
    expect(fitModelIdFromRef("")).toBe("");
    expect(fitModelIdFromRef(undefined)).toBe("");
  });
});
