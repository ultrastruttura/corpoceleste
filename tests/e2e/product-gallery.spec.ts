import { expect, test } from "@playwright/test";

/** Multi-image shirt used as gallery regression fixture. */
const PRODUCT_PATH = "/prodotto/esus/";

test.describe("product gallery", () => {
  test("external gallery script swaps main image on thumb click", async ({ page }) => {
    const cspHits: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /content security policy/i.test(msg.text())) {
        cspHits.push(msg.text());
      }
    });

    await page.goto(PRODUCT_PATH);

    // CSP blocks inline page scripts — gallery must load from a static file.
    await expect(page.locator('script[src*="product-gallery.js"]')).toHaveCount(1);

    const main = page.locator("[data-product-main]");
    const thumbs = page.locator("[data-product-thumb]");
    const index = page.locator("[data-gallery-index]");

    await expect(main).toBeVisible();
    await expect(thumbs).toHaveCount(4);
    await expect(index).toHaveText(/1\s*\/\s*4/);

    const before = await main.getAttribute("src");
    expect(before).toBeTruthy();

    await thumbs.nth(1).click();

    await expect(main).not.toHaveAttribute("src", before!);
    await expect(index).toHaveText(/2\s*\/\s*4/);
    await expect(thumbs.nth(1)).toHaveClass(/is-active/);
    await expect(thumbs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(thumbs.nth(0)).toHaveAttribute("aria-selected", "false");

    await page.locator("[data-gallery-next]").click();
    await expect(index).toHaveText(/3\s*\/\s*4/);

    expect(cspHits, cspHits.join("\n")).toEqual([]);
  });
});
