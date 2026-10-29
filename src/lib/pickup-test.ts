/**
 * Temporary PayPal workflow test: cart-only SKU skips Sendcloud (shipping €0).
 * Remove product + this helper after the test.
 */
export const PICKUP_TEST_PRODUCT_ID = "prova-pagamento";
export const PICKUP_TEST_SERVICE_ID = "PICKUP_TEST";

export function isPickupTestOnlyCart(lines: Array<{ id: string }>): boolean {
  return lines.length > 0 && lines.every((l) => String(l.id) === PICKUP_TEST_PRODUCT_ID);
}

export function isPickupTestServiceId(id: string | number | undefined | null): boolean {
  return String(id || "") === PICKUP_TEST_SERVICE_ID;
}
