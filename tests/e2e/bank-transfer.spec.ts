import { expect, test } from "@playwright/test";

async function seedCart(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "corpoceleste-cart",
      JSON.stringify([
        {
          id: "non-scegli-la-tua-casa",
          slug: "non-scegli-la-tua-casa",
          title: "Non scegli la tua casa",
          price: 45,
          size: "M",
          qty: 1,
          color: "",
          print: "",
        },
      ]),
    );
  });
}

const QUOTE = {
  shipping: "6.50",
  merchandise: "45.00",
  total: "51.50",
} as const;

function assertQuoteMath() {
  expect(Number(QUOTE.merchandise) + Number(QUOTE.shipping)).toBeCloseTo(
    Number(QUOTE.total),
    2,
  );
}

async function mockShippingQuote(page: import("@playwright/test").Page) {
  assertQuoteMath();
  await page.route("**/api/shipping-quote", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...QUOTE,
        serviceId: "poste:standard",
        carrier: "Poste Italiane Delivery",
        country: "IT",
        zip: "24067",
      }),
    });
  });
}

test.describe("bonifico checkout", () => {
  test("form stays locked and does not POST without quote/address/terms", async ({ page }) => {
    await seedCart(page);
    await mockShippingQuote(page);

    let orderPosts = 0;
    await page.route("**/api/order**", async (route) => {
      orderPosts += 1;
      await route.fulfill({ status: 200, body: "ok" });
    });

    await page.goto("/checkout/");
    await page.locator("[data-method][value='bonifico']").check();
    await expect(page.locator("[data-method-panel='bonifico']")).toBeVisible();

    const form = page.locator("[data-checkout-form]");
    await expect(form).toHaveClass(/is-locked/);
    await expect(page.locator("[data-bank-submit]")).toBeDisabled();
    await expect(page.locator("[data-bank-due]")).toBeHidden();

    // Force-enable and click — client unlock gate must still block the order API.
    await page.locator("[data-bank-submit]").evaluate((btn: HTMLButtonElement) => {
      btn.disabled = false;
      (btn.closest("form") as HTMLFormElement | null)?.requestSubmit(btn);
    });
    await expect.poll(() => orderPosts, { timeout: 1500 }).toBe(0);
  });

  test("shows bank amount after quote and unlocks only with complete data", async ({ page }) => {
    await seedCart(page);
    await mockShippingQuote(page);

    await page.goto("/checkout/");
    await page.locator("[data-method][value='bonifico']").check();

    await page.locator("[data-ship-zip]").fill("24067");
    await expect(page.locator("[data-ship-status]")).toContainText(
      new RegExp(QUOTE.shipping.replace(".", "\\.")),
      { timeout: 10_000 },
    );
    await expect(page.locator("[data-bank-due]")).toBeVisible();
    await expect(page.locator("[data-bank-due]")).toContainText(
      new RegExp(QUOTE.total.replace(".", "\\.")),
    );
    await expect(page.locator("[data-bank-due]")).toContainText(
      new RegExp(QUOTE.shipping.replace(".", "\\.")),
    );
    // Recap line items still show merchandise (45); due line is merch + ship.
    await expect(page.locator("[data-recap]")).toContainText(/45/);

    const form = page.locator("[data-checkout-form]");
    await expect(form).toHaveClass(/is-locked/);

    await page.locator("[data-ship-name]").fill("Ada Lovelace");
    await page.locator("[data-ship-email]").fill("ada@example.com");
    await page.locator("[data-ship-street]").fill("Via Roma 1");
    await page.locator("[data-ship-city]").fill("Sarnico");
    await page.locator("[data-disclaimer]").check();
    await page.locator("[data-privacy]").check();

    await expect(form).not.toHaveClass(/is-locked/);
    await expect(page.locator("[data-bank-submit]")).toBeEnabled();
  });
});
