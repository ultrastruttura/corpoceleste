/** Server-side pricing from catalog — never trust client unit amounts. */

import { isPurchasableStatus, loadCatalogProduct } from "./catalog.js";
import { isSupportedShipCountry } from "../src/lib/ship-countries.js";
import { mergeOrderLines } from "../src/lib/paypal-lines.js";
import { normalizeCountry, normalizeZip } from "../src/lib/ship-normalize.js";
import {
  packagesForQty,
  quoteShipping,
  sendcloudConfigured,
  type ShippingQuote,
} from "./sendcloud.js";
import type { OrderLine } from "./paypal.js";

/** Server caps — client maxQty is UX only; APIs must enforce these. */
export const MAX_ORDER_LINE_QTY = 99;
export const MAX_ORDER_LINES = 20;
export const MAX_ORDER_PIECES = 99;

export type PricedLine = OrderLine & {
  title: string;
  unitPrice: number;
  lineTotal: number;
};

export type ShipDest = {
  country: string;
  zip: string;
  city?: string;
  province?: string;
};

export type PricedOrder = {
  lines: PricedLine[];
  merchandise: number;
  shipping: number;
  total: number;
  shipZone: "it" | "eu";
  shipCountry: string;
  shipZip: string;
  /** Chosen Sendcloud rate (ledger still uses packlink* field names). */
  packlink: ShippingQuote;
  /** Cheapest studio-pickup vs dropoff (raw Sendcloud €, before floor). */
  shippingCompare?: {
    pickup: number | null;
    dropoff: number | null;
    firstMile: ShippingQuote["firstMile"];
  };
};

export function money(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** Sconto spedizione al cliente: arrotonda per difetto allo scaglione da 0,50 € (6,20→6,00; 6,70→6,50). */
export function floorShippingEuro(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n * 2) / 2;
}

export function shipZoneFromCountry(countryCode: string | undefined | null): "it" | "eu" {
  return normalizeCountry(countryCode) === "IT" ? "it" : "eu";
}

export function parseShipDest(input: {
  country?: string;
  zip?: string;
  city?: string;
  province?: string;
}): ShipDest | null {
  const country = normalizeCountry(input.country);
  const zip = normalizeZip(input.zip, country);
  if (!country || !zip || !isSupportedShipCountry(country)) return null;
  if (country === "IT" && !/^\d{5}$/.test(zip)) return null;
  const city = String(input.city || "").trim();
  const province = String(input.province || "").trim();
  return {
    country,
    zip,
    ...(city ? { city } : {}),
    ...(province ? { province } : {}),
  };
}

export async function priceOrderLines(
  rawLines: OrderLine[],
  dest: ShipDest,
  opts?: { ignoreStock?: boolean },
): Promise<{ ok: true; order: PricedOrder } | { ok: false; error: string }> {
  if (!rawLines.length) return { ok: false, error: "Empty cart" };
  if (rawLines.length > MAX_ORDER_LINES * 3) {
    return { ok: false, error: "Too many lines" };
  }

  const shipCountry = normalizeCountry(dest.country);
  const shipZip = normalizeZip(dest.zip, shipCountry);
  if (!shipCountry || !shipZip || !isSupportedShipCountry(shipCountry)) {
    return { ok: false, error: "Invalid shipping destination" };
  }
  if (shipCountry === "IT" && !/^\d{5}$/.test(shipZip)) {
    return { ok: false, error: "Invalid shipping destination" };
  }

  const merged = mergeOrderLines(rawLines, { maxQty: MAX_ORDER_LINE_QTY });
  if (!merged.length) return { ok: false, error: "Invalid line" };
  if (merged.length > MAX_ORDER_LINES) {
    return { ok: false, error: "Too many lines" };
  }

  const priced: PricedLine[] = [];
  let merchandise = 0;
  let pieceCount = 0;
  for (const line of merged) {
    const product = await loadCatalogProduct(line.id);
    if (!product) return { ok: false, error: `Unknown product ${line.id}` };
    if (!isPurchasableStatus(product.status)) {
      return { ok: false, error: `Not for sale: ${line.id}` };
    }
    if (!product.sizes.includes(line.size)) {
      return { ok: false, error: `Invalid size ${line.id} ${line.size}` };
    }
    const stock = product.stock[line.size] ?? 0;
    // Pre-order may sell at 0 stock but still capped by MAX_ORDER_LINE_QTY.
    // ignoreStock: PayPal webhook after create-order already reserved units.
    if (!opts?.ignoreStock && product.status !== "preorder" && stock < line.qty) {
      return { ok: false, error: `Out of stock ${line.id} ${line.size}` };
    }
    if (!Number.isFinite(product.price) || product.price <= 0) {
      return { ok: false, error: `Bad price ${line.id}` };
    }
    const unitPrice = Math.round(product.price * 100) / 100;
    const lineTotal = Math.round(unitPrice * line.qty * 100) / 100;
    merchandise += lineTotal;
    pieceCount += line.qty;
    if (pieceCount > MAX_ORDER_PIECES) {
      return { ok: false, error: "Too many pieces" };
    }
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

  if (!sendcloudConfigured()) {
    return { ok: false, error: "Shipping not configured (Sendcloud keys)" };
  }

  let selection: Awaited<ReturnType<typeof quoteShipping>> = null;
  try {
    selection = await quoteShipping({
      toCountry: shipCountry,
      toZip: shipZip,
      toCity: dest.city,
      toProvince: dest.province,
      packages: packagesForQty(pieceCount),
    });
  } catch (err) {
    console.error("sendcloud quote", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Shipping quote failed: ${msg.slice(0, 160)}` };
  }
  if (!selection) {
    return {
      ok: false,
      error: "Shipping unavailable (Sendcloud: no home rate for this CAP — check FROM_* and carriers)",
    };
  }

  const packlink = selection.chosen;
  const shipping = floorShippingEuro(packlink.price);
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
      packlink: { ...packlink, price: shipping },
      shippingCompare: {
        pickup: selection.cheapestPickup?.price ?? null,
        dropoff: selection.cheapestDropoff?.price ?? null,
        firstMile: packlink.firstMile,
      },
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
