import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("tina-lock shopper schema", () => {
  const lock = readFileSync(resolve("tina/tina-lock.json"), "utf8");

  it("includes shopper kind and stockQty field", () => {
    expect(lock).toContain('"value":"shopper"');
    expect(lock).toContain('"name":"stockQty"');
  });
});
