import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  normalizeSignature,
  signatureOk,
} from "../../server/sendcloud-webhook-handler";

describe("normalizeSignature", () => {
  it("strips sha256= prefix and lowercases", () => {
    expect(normalizeSignature("sha256=ABC")).toBe("abc");
    expect(normalizeSignature("  DEF  ")).toBe("def");
  });
});

describe("signatureOk", () => {
  const body = Buffer.from('{"action":"parcel_status_changed"}', "utf8");
  const secret = "test-webhook-secret";

  it("accepts a valid HMAC hex signature", () => {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(signatureOk(body, sig, [secret])).toBe(true);
    expect(signatureOk(body, `sha256=${sig}`, [secret])).toBe(true);
  });

  it("rejects tampered body or wrong secret", () => {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(signatureOk(Buffer.from("{}"), sig, [secret])).toBe(false);
    expect(signatureOk(body, sig, ["other-secret"])).toBe(false);
    expect(signatureOk(body, "", [secret])).toBe(false);
  });
});
