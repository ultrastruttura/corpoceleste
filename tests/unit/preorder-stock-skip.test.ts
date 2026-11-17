import { describe, expect, it } from "vitest";

/** Mirror server/github-stock isPreorderMarkdown (kept local — function is private). */
function isPreorderMarkdown(content: string) {
  return /^status:\s*preorder\s*$/m.test(content);
}

describe("preorder stock skip", () => {
  it("detects Tina preorder frontmatter", () => {
    expect(
      isPreorderMarkdown("---\ntitle: Shopper\nstatus: preorder\nstockQty: 32\n---\n"),
    ).toBe(true);
    expect(isPreorderMarkdown("---\nstatus: available\nstockQty: 2\n---\n")).toBe(false);
  });
});
