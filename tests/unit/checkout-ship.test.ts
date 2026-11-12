import { describe, expect, it } from "vitest";
import { buildShipTo, hasCompleteAddress } from "../../src/scripts/checkout-ship";

describe("buildShipTo / hasCompleteAddress", () => {
  it("requires name email street city", () => {
    const a = buildShipTo({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
      street: "Via Roma 1",
      city: "Sarnico",
      province: "BG",
      country: "IT",
    });
    expect(a.province).toBe("BG");
    expect(hasCompleteAddress(a)).toBe(true);
  });

  it("rejects incomplete address", () => {
    const a = buildShipTo({
      fullName: "Ada",
      email: "not-an-email",
      phone: "",
      street: "",
      city: "Sarnico",
      province: "",
      country: "IT",
    });
    expect(hasCompleteAddress(a)).toBe(false);
  });
});
