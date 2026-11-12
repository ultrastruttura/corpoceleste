import { describe, expect, it } from "vitest";
import { isSupportedShipCountry } from "../../src/lib/ship-countries";
import { normalizeCountry, normalizeZip } from "../../src/lib/ship-normalize";

describe("normalizeCountry", () => {
  it("uppercases and trims to 2 letters", () => {
    expect(normalizeCountry(" it ")).toBe("IT");
    expect(normalizeCountry("deutschland")).toBe("DE");
  });
});

describe("normalizeZip", () => {
  it("keeps IT digits only max 5", () => {
    expect(normalizeZip("24 067", "IT")).toBe("24067");
    expect(normalizeZip("24067-XX", "IT")).toBe("24067");
  });

  it("allows alphanumeric EU zips", () => {
    expect(normalizeZip("sw1a 1aa", "GB")).toBe("SW1A 1AA");
  });
});

describe("isSupportedShipCountry", () => {
  it("allows IT and common EU", () => {
    expect(isSupportedShipCountry("IT")).toBe(true);
    expect(isSupportedShipCountry("DE")).toBe(true);
  });

  it("rejects non-EU / empty", () => {
    expect(isSupportedShipCountry("US")).toBe(false);
    expect(isSupportedShipCountry("")).toBe(false);
  });
});
