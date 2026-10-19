/** Purchasable rules shared by build catalog, live stock overlay, and cart. */

export type ProductStatus = "available" | "preorder" | "soldout";

export function parseProductStatus(raw: unknown): ProductStatus {
  if (raw === "soldout") return "soldout";
  if (raw === "preorder") return "preorder";
  return "available";
}

export function isPurchasableStatus(status: string | undefined | null) {
  return status === "available" || status === "preorder";
}

/** Client + server qty ceiling. Preorder ignores live stock but still caps at 99. */
export function maxQtyForStatus(status: string, stockForSize: number) {
  if (status === "preorder") return 99;
  const n = Number.isFinite(stockForSize) ? Math.max(0, Math.floor(stockForSize)) : 0;
  return Math.min(99, n);
}

export function sizeSellable(status: string, stockForSize: number) {
  if (status === "preorder") return true;
  return maxQtyForStatus(status, stockForSize) > 0;
}
