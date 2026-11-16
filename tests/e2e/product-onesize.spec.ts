import { expect, test } from "@playwright/test";

/** Print kind → one-size UI (no S–XXL), even if Tina still has leftover size fields. */
const PRINT_PATH = "/prodotto/cynosura-print/";

test.describe("one-size product UI", () => {
  test("print product hides size picker and size guide", async ({ page }) => {
    await page.goto(PRINT_PATH);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".size-fieldset")).toHaveCount(0);
    await expect(page.locator(".size-guide-link")).toHaveCount(0);
    await expect(page.locator(".size-chart")).toHaveCount(0);
  });
});
