import { expect, test } from "@playwright/test";

const PRODUCT_PATH = "/prodotto/non-scegli-la-tua-casa/";

test.describe("shop checkout smoke", () => {
  test("home loads without fatal page errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("add to cart, checkout ZIP quote via mocked API", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.route("**/api/shipping-quote", async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({ status: 204 });
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
          carrier: "Poste Italiane Delivery",
          country: "IT",
          zip: "24067",
        }),
      });
    });

    await page.goto(PRODUCT_PATH);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const addForm = page.locator("[data-add-form]");
    await expect(addForm).toBeVisible();
    await addForm.locator('button[type="submit"]').click();

    await expect(page.locator("[data-cart-lines]")).toContainText(/Non scegli/i, {
      timeout: 10_000,
    });

    await page.goto("/checkout/");
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
    await expect(page.locator("[data-checkout-empty]")).toBeHidden();

    await page.locator("[data-ship-zip]").fill("24067");
    await expect(page.locator("[data-ship-status]")).toContainText(/6\.50/, {
      timeout: 10_000,
    });

    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("checkout keeps pay locked until address and terms", async ({ page }) => {
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

    await page.goto("/checkout/");
    await expect(page.locator("[data-checkout-flow]")).toBeVisible();
    await expect(page.locator("[data-pay-box]")).toHaveClass(/is-locked/);
  });
});

test.describe("mobile home", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home is usable on mobile viewport", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible();
  });
});
