import { describe, expect, it } from "vitest";
import {
  floorShippingEuro,
  money,
  parseShipDest,
  paymentCoversExpected,
  shipZoneFromCountry,
} from "../../server/order-pricing";

describe("money", () => {
  it("formats to two decimal places as string", () => {
    expect(money(6.5)).toBe("6.50");
    expect(money(6.505)).toBe("6.51");
    expect(money(0)).toBe("0.00");
  });
});

describe("floorShippingEuro", () => {
  it("floors to 0.50 EUR steps", () => {
    expect(floorShippingEuro(6.2)).toBe(6);
    expect(floorShippingEuro(6.7)).toBe(6.5);
    expect(floorShippingEuro(6.5)).toBe(6.5);
  });

  it("returns 0 for non-positive or non-finite", () => {
    expect(floorShippingEuro(0)).toBe(0);
    expect(floorShippingEuro(-1)).toBe(0);
    expect(floorShippingEuro(Number.NaN)).toBe(0);
  });
});

describe("shipZoneFromCountry", () => {
  it("maps IT vs EU", () => {
    expect(shipZoneFromCountry("IT")).toBe("it");
    expect(shipZoneFromCountry("it")).toBe("it");
    expect(shipZoneFromCountry("DE")).toBe("eu");
  });
});

describe("parseShipDest", () => {
  it("accepts valid IT CAP", () => {
    expect(parseShipDest({ country: "IT", zip: "24067", city: "Sarnico" })).toEqual({
      country: "IT",
      zip: "24067",
      city: "Sarnico",
    });
  });

  it("rejects invalid IT CAP length", () => {
    expect(parseShipDest({ country: "IT", zip: "2406" })).toBeNull();
  });

  it("rejects unsupported country", () => {
    expect(parseShipDest({ country: "US", zip: "10001" })).toBeNull();
  });

  it("normalizes EU zip", () => {
    const dest = parseShipDest({ country: "DE", zip: "10115", city: "Berlin" });
    expect(dest?.country).toBe("DE");
    expect(dest?.zip).toBe("10115");
  });
});

describe("paymentCoversExpected", () => {
  it("allows exact and 1 cent underpay slack", () => {
    expect(paymentCoversExpected(51.5, 51.5)).toBe(true);
    expect(paymentCoversExpected(51.5, 51.51)).toBe(true);
    expect(paymentCoversExpected(51.5, 51.52)).toBe(false);
  });

  it("rejects non-finite amounts", () => {
    expect(paymentCoversExpected(Number.NaN, 10)).toBe(false);
    expect(paymentCoversExpected(10, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
