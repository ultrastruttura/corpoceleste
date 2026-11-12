import { beforeEach, describe, expect, it, vi } from "vitest";

const loadCatalogProduct = vi.fn();
const quoteShipping = vi.fn();
const sendcloudConfigured = vi.fn(() => true);

vi.mock("../../server/catalog.js", () => ({
  loadCatalogProduct: (...args: unknown[]) => loadCatalogProduct(...args),
  isPurchasableStatus: (status: string) => status === "available" || status === "preorder",
}));

vi.mock("../../server/sendcloud.js", () => ({
  sendcloudConfigured: () => sendcloudConfigured(),
  packagesForQty: (qty: number) => [
    { width: 35, height: 25, length: 8, weight: Math.max(0.1, 0.4 * qty) },
  ],
  quoteShipping: (...args: unknown[]) => quoteShipping(...args),
}));

import { priceOrderLines } from "../../server/order-pricing";

const dest = { country: "IT", zip: "24067", city: "Sarnico" };

function product(partial?: Record<string, unknown>) {
  return {
    id: "tee",
    title: "Tee",
    price: 45,
    status: "available",
    sizes: ["S", "M", "L"],
    stock: { S: 2, M: 5, L: 0 },
    ...partial,
  };
}

describe("priceOrderLines", () => {
  beforeEach(() => {
    loadCatalogProduct.mockReset();
    quoteShipping.mockReset();
    sendcloudConfigured.mockReset();
    sendcloudConfigured.mockReturnValue(true);
  });

  it("prices merchandise and floors shipping from Sendcloud", async () => {
    loadCatalogProduct.mockResolvedValue(product());
    quoteShipping.mockResolvedValue({
      chosen: {
        serviceId: "poste:std",
        price: 6.7,
        currency: "EUR",
        carrier: "Poste",
        serviceName: "Standard",
        firstMile: "pickup",
      },
      cheapestPickup: {
        serviceId: "poste:std",
        price: 6.7,
        currency: "EUR",
        carrier: "Poste",
        serviceName: "Standard",
        firstMile: "pickup",
      },
      cheapestDropoff: null,
    });

    const priced = await priceOrderLines([{ id: "tee", size: "M", qty: 2 }], dest);
    expect(priced.ok).toBe(true);
    if (priced.ok === false) return;
    expect(priced.order.merchandise).toBe(90);
    expect(priced.order.shipping).toBe(6.5);
    expect(priced.order.total).toBe(96.5);
    expect(priced.order.packlink.serviceId).toBe("poste:std");
    expect(quoteShipping).toHaveBeenCalledOnce();
  });

  it("forces shipping 0 for hand pickup", async () => {
    loadCatalogProduct.mockResolvedValue(product());
    const priced = await priceOrderLines([{ id: "tee", size: "M", qty: 1 }], dest, {
      delivery: "pickup",
    });
    expect(priced.ok).toBe(true);
    if (priced.ok === false) return;
    expect(priced.order.shipping).toBe(0);
    expect(priced.order.total).toBe(45);
    expect(quoteShipping).not.toHaveBeenCalled();
  });

  it("rejects out of stock when not ignored", async () => {
    loadCatalogProduct.mockResolvedValue(product({ stock: { M: 1 } }));
    const priced = await priceOrderLines([{ id: "tee", size: "M", qty: 3 }], dest);
    expect(priced).toEqual({ ok: false, error: "Out of stock tee M" });
    expect(quoteShipping).not.toHaveBeenCalled();
  });

  it("allows ignoreStock after PayPal hold", async () => {
    loadCatalogProduct.mockResolvedValue(product({ stock: { M: 0 } }));
    quoteShipping.mockResolvedValue({
      chosen: {
        serviceId: "poste:std",
        price: 5,
        currency: "EUR",
        carrier: "Poste",
        serviceName: "Standard",
        firstMile: "dropoff",
      },
      cheapestPickup: null,
      cheapestDropoff: {
        serviceId: "poste:std",
        price: 5,
        currency: "EUR",
        carrier: "Poste",
        serviceName: "Standard",
        firstMile: "dropoff",
      },
    });
    const priced = await priceOrderLines([{ id: "tee", size: "M", qty: 1 }], dest, {
      ignoreStock: true,
    });
    expect(priced.ok).toBe(true);
    if (priced.ok === false) return;
    expect(priced.order.total).toBe(50);
  });

  it("rejects sold-out catalog status", async () => {
    loadCatalogProduct.mockResolvedValue(product({ status: "soldout" }));
    const priced = await priceOrderLines([{ id: "tee", size: "M", qty: 1 }], dest);
    expect(priced).toEqual({ ok: false, error: "Not for sale: tee" });
  });

  it("rejects when Sendcloud is not configured", async () => {
    loadCatalogProduct.mockResolvedValue(product());
    sendcloudConfigured.mockReturnValue(false);
    const priced = await priceOrderLines([{ id: "tee", size: "M", qty: 1 }], dest);
    expect(priced).toEqual({
      ok: false,
      error: "Shipping not configured (Sendcloud keys)",
    });
  });
});
