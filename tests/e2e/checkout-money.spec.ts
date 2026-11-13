import { expect, test } from "@playwright/test";

async function seedCart(
  page: import("@playwright/test").Page,
  qty: number,
) {
  await page.addInitScript((n) => {
    localStorage.setItem(
      "corpoceleste-cart",
      JSON.stringify([
        {
          id: "non-scegli-la-tua-casa",
          slug: "non-scegli-la-tua-casa",
          title: "Non scegli la tua casa",
          price: 45,
          size: "M",
          qty: n,
          color: "",
          print: "",
        },
      ]),
    );
  }, qty);
}

test.describe("checkout money coherence", () => {
  test("qty 2: bank due = merchandise + shipping from quote", async ({ page }) => {
    const merchandise = 90;
    const shipping = 6.5;
    const total = merchandise + shipping;

    await seedCart(page, 2);
    await page.route("**/api/shipping-quote", async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({ status: 204 });
        return;
      }
      const posted = route.request().postDataJSON() as {
        lines?: Array<{ qty?: number }>;
      };
      const qty = posted?.lines?.[0]?.qty ?? 0;
      expect(qty).toBe(2);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          shipping: shipping.toFixed(2),
          merchandise: merchandise.toFixed(2),
          total: total.toFixed(2),
          serviceId: "poste:standard",
          carrier: "Poste Italiane Delivery",
          country: "IT",
          zip: "24067",
        }),
      });
    });

    await page.goto("/checkout/");
    await page.locator("[data-method][value='bonifico']").check();
    await page.locator("[data-ship-zip]").fill("24067");

    await expect(page.locator("[data-ship-status]")).toContainText(/6\.50/, {
      timeout: 10_000,
    });
    await expect(page.locator("[data-bank-due]")).toBeVisible();
    await expect(page.locator("[data-bank-due]")).toContainText(/96\.50/);
    await expect(page.locator("[data-bank-due]")).toContainText(/6\.50/);
    await expect(page.locator("[data-recap]")).toContainText(/90|45/);
  });

  test("unsupported country keeps pay locked after failed quote", async ({ page }) => {
    await seedCart(page, 1);

    await page.route("**/api/shipping-quote", async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({ status: 204 });
        return;
      }
      const posted = route.request().postDataJSON() as { country?: string };
      if (String(posted?.country || "").toUpperCase() === "US") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid shipping destination" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          shipping: "6.50",
          merchandise: "45.00",
          total: "51.50",
          serviceId: "poste:standard",
          carrier: "Poste",
          country: "IT",
          zip: "24067",
        }),
      });
    });

    await page.goto("/checkout/");
    await page.locator("[data-method][value='bonifico']").check();

    // Inject a non-EU option (not in the shop allowlist) and select it.
    await page.locator("[data-ship-country]").evaluate((sel: HTMLSelectElement) => {
      const opt = document.createElement("option");
      opt.value = "US";
      opt.textContent = "United States";
      sel.appendChild(opt);
      sel.value = "US";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await page.locator("[data-ship-zip]").fill("10001");
    await expect(page.locator("[data-ship-status]")).not.toContainText(/6\.50/, {
      timeout: 10_000,
    });
    await expect(page.locator("[data-pay-box]")).toHaveClass(/is-locked/);
    await expect(page.locator("[data-checkout-form]")).toHaveClass(/is-locked/);
    await expect(page.locator("[data-bank-due]")).toBeHidden();
  });
});
