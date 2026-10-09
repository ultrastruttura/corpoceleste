/** Server-side pricing from catalog — never trust client unit amounts. */

import { isPurchasableStatus, loadCatalogProduct } from "./catalog.js";
import { isSupportedShipCountry } from "../src/lib/ship-countries.js";
import {
  normalizeCountry,
  normalizeZip,
  packagesForQty,
  quoteCheapest,
  type ShippingQuote,
} from "./sendcloud.js";
import type { OrderLine } from "./paypal.js";

export type PricedLine = OrderLine & {
  title: string;
  unitPrice: number;
  lineTotal: number;
};

export type ShipDest = {
  country: string;
  zip: string;
};

export type PricedOrder = {
  lines: PricedLine[];
  merchandise: number;
  shipping: number;
  total: number;
  shipZone: "it" | "eu";
  shipCountry: string;
  shipZip: string;
  /** Cheapest Sendcloud rate for destination (ledger still uses packlink* field names). */
  packlink: ShippingQuote;
};

export function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function shipZoneFromCountry(countryCode: string | undefined | null): "it" | "eu" {
  return normalizeCountry(countryCode) === "IT" ? "it" : "eu";
}

export function parseShipDest(input: {
  country?: string;
  zip?: string;
}): ShipDest | null {
  const country = normalizeCountry(input.country);
  const zip = normalizeZip(input.zip);
  if (!country || !zip || !isSupportedShipCountry(country)) return null;
  return { country, zip };
}

export async function priceOrderLines(
  rawLines: OrderLine[],
  dest: ShipDest,
): Promise<{ ok: true; order: PricedOrder } | { ok: false; error: string }> {
  if (!rawLines.length) return { ok: false, error: "Empty cart" };

  const shipCountry = normalizeCountry(dest.country);
  const shipZip = normalizeZip(dest.zip);
  if (!shipCountry || !shipZip || !isSupportedShipCountry(shipCountry)) {
    return { ok: false, error: "Invalid shipping destination" };
  }

  const merged = new Map<string, OrderLine>();
  for (const line of rawLines) {
    const id = String(line.id || "").trim();
    const size = String(line.size || "").trim();
    const qty = Math.max(1, Math.floor(Number(line.qty) || 0));
    if (!id || !size || qty < 1) return { ok: false, error: "Invalid line" };
    const key = `${id}::${size}`;
    const prev = merged.get(key);
    if (prev) prev.qty += qty;
    else merged.set(key, { id, size, qty });
  }

  const priced: PricedLine[] = [];
  let merchandise = 0;
  let pieceCount = 0;
  for (const line of merged.values()) {
    const product = await loadCatalogProduct(line.id);
    if (!product) return { ok: false, error: `Unknown product ${line.id}` };
    if (!isPurchasableStatus(product.status)) {
      return { ok: false, error: `Not for sale: ${line.id}` };
    }
    if (!product.sizes.includes(line.size)) {
      return { ok: false, error: `Invalid size ${line.id} ${line.size}` };
    }
    const stock = product.stock[line.size] ?? 0;
    if (stock < line.qty) {
      return { ok: false, error: `Out of stock ${line.id} ${line.size}` };
    }
    if (!Number.isFinite(product.price) || product.price <= 0) {
      return { ok: false, error: `Bad price ${line.id}` };
    }
    const unitPrice = Math.round(product.price * 100) / 100;
    const lineTotal = Math.round(unitPrice * line.qty * 100) / 100;
    merchandise += lineTotal;
    pieceCount += line.qty;
    priced.push({
      id: line.id,
      size: line.size,
      qty: line.qty,
      title: product.title,
      unitPrice,
      lineTotal,
    });
  }

  merchandise = Math.round(merchandise * 100) / 100;

  let packlink: ShippingQuote | null = null;
  try {
    packlink = await quoteCheapest({
      toCountry: shipCountry,
      toZip: shipZip,
      packages: packagesForQty(pieceCount),
    });
  } catch (err) {
    console.error("sendcloud quote", err);
  }
  if (!packlink) return { ok: false, error: "Shipping unavailable" };

  const shipping = packlink.price;
  const total = Math.round((merchandise + shipping) * 100) / 100;
  return {
    ok: true,
    order: {
      lines: priced,
      merchandise,
      shipping,
      total,
      shipZone: shipZoneFromCountry(shipCountry),
      shipCountry,
      shipZip,
      packlink,
    },
  };
}

/**
 * Paid amount must cover catalog merchandise + shipping for destination.
 * Overpay is accepted; underpay is not.
 */
export function paymentCoversExpected(paid: number, expected: number) {
  return Number.isFinite(paid) && Number.isFinite(expected) && paid + 0.015 >= expected;
}
