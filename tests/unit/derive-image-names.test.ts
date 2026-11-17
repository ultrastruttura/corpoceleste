import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { describe, expect, it } from "vitest";

/** Mirror scripts/derive-product-images.mjs + src/lib/paths.ts naming. */
function derivedFileName(file: string) {
  const stem = basename(file, extname(file));
  const tag = createHash("sha1").update(file).digest("hex").slice(0, 8);
  return `${stem}.${tag}.webp`;
}

describe("product image derive naming", () => {
  it("writes stable card webp names for uploads", () => {
    const file = "Paradine-scudo.jpg";
    expect(derivedFileName(file)).toBe("Paradine-scudo.e4c45370.webp");
    const expected = join("public", "derived", "card", derivedFileName(file));
    if (existsSync(expected)) {
      expect(existsSync(expected)).toBe(true);
    }
  });
});
