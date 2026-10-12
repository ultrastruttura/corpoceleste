/**
 * Spedire.com (Alsendo) — quote cheapest rate + create parcel/labels.
 *
 * Stessa superficie pubblica di ex-Sendcloud (checkout + webhook PayPal).
 * Auth/path ufficiali non sono pubblici: base URL e path sono env-driven.
 * Quando Spedire consegna le docs, aggiorna solo le sezioni HTTP sotto
 * (payload + parser), senza toccare order-pricing / webhook.
 */

import { isSupportedShipCountry, SHIP_COUNTRIES } from "../src/lib/ship-countries.js";

export { SHIP_COUNTRIES, isSupportedShipCountry };

export type ShipPackage = {
  width: number;
  height: number;
  length: number;
  weight: number;
};

export type ShippingQuote = {
  /** Id servizio/corriere da riusare in createShipmentAndLabels */
  serviceId: string | number;
  price: number;
  currency: string;
  carrier: string;
  serviceName: string;
  transitDays?: string;
};

export type ShipAddress = {
  name: string;
  surname?: string;
  company?: string;
  street1: string;
  street2?: string;
  zip_code: string;
  city: string;
  state?: string;
  country: string;
  phone: string;
  email: string;
};

export type ShipShipmentResult = {
  reference: string;
  labelUrls: string[];
};

function envNum(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envStr(name: string, fallback = "") {
  return (process.env[name] || "").trim() || fallback;
}

function apiBase() {
  return envStr("SPEDIRE_API_BASE").replace(/\/+$/, "");
}

function apiKey() {
  return envStr("SPEDIRE_API_KEY");
}

function apiSecret() {
  return envStr("SPEDIRE_API_SECRET");
}

/** True when credentials + base URL are present (paths may still need docs). */
export function spedireConfigured() {
  return Boolean(apiBase() && apiKey());
}

/** @deprecated alias — prefer spedireConfigured */
export function sendcloudConfigured() {
  return spedireConfigured();
}

/** Default shirt parcel; weight scales with qty. */
export function packagesForQty(qty: number): ShipPackage[] {
  const pieces = Math.max(1, Math.floor(qty) || 1);
  const unitW = envNum("SPEDIRE_PKG_WEIGHT", 0.4);
  const width = envNum("SPEDIRE_PKG_WIDTH", 35);
  const height = envNum("SPEDIRE_PKG_HEIGHT", 25);
  const length = envNum("SPEDIRE_PKG_LENGTH", 8);
  const h = Math.min(height + Math.max(0, pieces - 1) * 2, 40);
  const weight = Math.min(Math.round(unitW * pieces * 100) / 100, 20);
  return [{ width, height: h, length, weight: Math.max(0.1, weight) }];
}

export function normalizeCountry(code: string | undefined | null) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
}

export function normalizeZip(zip: string | undefined | null) {
  return String(zip || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function originFromEnv(): Omit<ShipAddress, "name" | "surname" | "phone" | "email"> & {
  name: string;
  surname: string;
  phone: string;
  email: string;
} {
  const name = envStr("SPEDIRE_FROM_NAME", "Corpoceleste");
  const parts = name.split(/\s+/);
  return {
    name: parts[0] || "Corpoceleste",
    surname: parts.slice(1).join(" ") || "Studio",
    company: envStr("SPEDIRE_FROM_COMPANY", "Corpoceleste"),
    street1: envStr("SPEDIRE_FROM_ADDRESS"),
    zip_code: normalizeZip(envStr("SPEDIRE_FROM_ZIP")),
    city: envStr("SPEDIRE_FROM_CITY"),
    country: normalizeCountry(envStr("SPEDIRE_FROM_COUNTRY", "IT")) || "IT",
    phone: envStr("SPEDIRE_FROM_PHONE"),
    email: envStr("SPEDIRE_FROM_EMAIL") || envStr("SHOP_EMAIL"),
  };
}

/** Split "Via Roma 12" → street + house number. */
export function splitStreetHouse(street: string): { address: string; house_number: string } {
  const s = street.trim();
  const m = s.match(/^(.*?)[,\s]+(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?)\s*$/);
  if (m) return { address: m[1].trim() || s, house_number: m[2] };
  return { address: s || "Via", house_number: "1" };
}

function splitPersonName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { name: "Cliente", surname: "Corpoceleste" };
  if (parts.length === 1) return { name: parts[0], surname: "-" };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

export function personFromFullName(fullName: string) {
  return splitPersonName(fullName);
}

async function spedireFetch(path: string, init?: RequestInit) {
  const base = apiBase();
  const key = apiKey();
  if (!base || !key) throw new Error("Missing SPEDIRE_API_BASE / SPEDIRE_API_KEY");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
  };

  const secret = apiSecret();
  if (secret) {
    headers.Authorization = `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
  } else {
    headers.Authorization = `Bearer ${key}`;
    headers["X-API-KEY"] = key;
  }

  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, {
      ...init,
      headers: { ...headers, ...(init?.headers || {}) },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

/**
 * Normalize a rate object from Spedire (field names TBD — support common aliases).
 * Adjust when official docs arrive.
 */
function parseRate(raw: unknown): ShippingQuote | null {
  const o = asRecord(raw);
  if (!o) return null;

  const serviceId =
    o.serviceId ?? o.service_id ?? o.id ?? o.carrierServiceId ?? o.product_id ?? o.tariffId;
  if (serviceId == null || serviceId === "") return null;

  const price =
    num(o.price) ??
    num(o.total) ??
    num(o.amount) ??
    num(o.cost) ??
    num(asRecord(o.price)?.value) ??
    num(asRecord(o.price)?.amount);
  if (price == null || price < 0) return null;

  const currency =
    str(o.currency) ||
    str(asRecord(o.price)?.currency) ||
    "EUR";

  return {
    serviceId: typeof serviceId === "number" || typeof serviceId === "string" ? serviceId : str(serviceId),
    price: Math.round(price * 100) / 100,
    currency: currency.toUpperCase() || "EUR",
    carrier: str(o.carrier) || str(o.carrierName) || str(o.courier) || str(o.provider),
    serviceName: str(o.serviceName) || str(o.service_name) || str(o.name) || str(o.productName),
    transitDays:
      str(o.transitDays) ||
      str(o.transit_days) ||
      str(o.deliveryDays) ||
      (num(o.lead_time_hours) != null
        ? String(Math.max(1, Math.ceil((num(o.lead_time_hours) as number) / 24)))
        : undefined) ||
      undefined,
  };
}

function ratesFromBody(data: unknown): ShippingQuote[] {
  const root = asRecord(data) || {};
  const candidates: unknown[] = [];
  for (const key of ["rates", "offers", "quotes", "services", "shipping_methods", "data", "results"]) {
    const v = root[key];
    if (Array.isArray(v)) candidates.push(...v);
  }
  if (Array.isArray(data)) candidates.push(...data);

  const out: ShippingQuote[] = [];
  for (const item of candidates) {
    const q = parseRate(item);
    if (q) out.push(q);
  }
  return out;
}

function pickCheapest(quotes: ShippingQuote[]): ShippingQuote | null {
  let best: ShippingQuote | null = null;
  for (const q of quotes) {
    if (!best || q.price < best.price) best = q;
  }
  return best;
}

export async function quoteCheapest(input: {
  toCountry: string;
  toZip: string;
  packages: ShipPackage[];
}): Promise<ShippingQuote | null> {
  if (!spedireConfigured()) return null;

  const from = originFromEnv();
  if (!from.zip_code) {
    console.error("[SPEDIRE] SPEDIRE_FROM_ZIP missing");
    return null;
  }

  const toCountry = normalizeCountry(input.toCountry);
  const toZip = normalizeZip(input.toZip);
  if (!toCountry || !toZip || !isSupportedShipCountry(toCountry)) return null;

  const pkg = input.packages[0] || packagesForQty(1);
  const weightKg = input.packages.reduce((n, p) => n + p.weight, 0);

  // Path default — override con SPEDIRE_QUOTE_PATH quando hai le docs.
  const path = envStr("SPEDIRE_QUOTE_PATH", "/v1/rates");

  const body = {
    from: {
      country: from.country,
      zip: from.zip_code,
      city: from.city,
      address: from.street1,
    },
    to: {
      country: toCountry,
      zip: toZip,
    },
    packages: input.packages.map((p) => ({
      weight: p.weight,
      width: p.width,
      height: p.height,
      length: p.length,
    })),
    // alias comuni usati da altri aggregatori IT
    weight: weightKg,
    width: pkg.width,
    height: pkg.height,
    length: pkg.length,
    destination_country: toCountry,
    destination_zip: toZip,
    origin_country: from.country,
    origin_zip: from.zip_code,
  };

  const res = await spedireFetch(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    console.error("[SPEDIRE] quote", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const best = pickCheapest(ratesFromBody(data));
  if (!best) {
    console.error("[SPEDIRE] quote: no parseable rates", JSON.stringify(data).slice(0, 500));
  }
  return best;
}

function labelUrlsFromUnknown(raw: unknown): string[] {
  const urls: string[] = [];
  const push = (u: unknown) => {
    const s = str(u);
    if (s.startsWith("http")) urls.push(s);
  };

  const walk = (v: unknown, depth = 0) => {
    if (depth > 4 || v == null) return;
    if (typeof v === "string") {
      push(v);
      return;
    }
    if (Array.isArray(v)) {
      for (const x of v) walk(x, depth + 1);
      return;
    }
    const o = asRecord(v);
    if (!o) return;
    for (const key of [
      "labelUrl",
      "label_url",
      "label",
      "labels",
      "pdfUrl",
      "pdf_url",
      "url",
      "normal_printer",
      "label_printer",
    ]) {
      if (key in o) walk(o[key], depth + 1);
    }
  };

  walk(raw);
  return [...new Set(urls)];
}

function parseCreateResponse(data: unknown): ShipShipmentResult {
  const root = asRecord(data) || {};
  const nested =
    asRecord(root.shipment) ||
    asRecord(root.parcel) ||
    asRecord(root.order) ||
    asRecord(root.data) ||
    root;

  const reference =
    str(nested.tracking_number) ||
    str(nested.trackingNumber) ||
    str(nested.waybill) ||
    str(nested.reference) ||
    str(nested.id) ||
    str(root.tracking_number) ||
    str(root.reference) ||
    str(root.id);

  if (!reference) throw new Error("Spedire create: missing reference/tracking");

  const labelUrls = labelUrlsFromUnknown(data);
  return { reference, labelUrls };
}

export async function createShipmentAndLabels(input: {
  serviceId: string | number;
  to: ShipAddress;
  packages: ShipPackage[];
  content: string;
  contentValue: number;
  customReference?: string;
}): Promise<ShipShipmentResult> {
  const from = originFromEnv();
  if (!from.street1 || !from.city || !from.zip_code || !from.phone || !from.email) {
    throw new Error("Spedire origin incomplete (SPEDIRE_FROM_* env)");
  }

  const weightKg = Math.max(
    0.001,
    Math.round(input.packages.reduce((n, p) => n + p.weight, 0) * 1000) / 1000,
  );
  const toStreet = splitStreetHouse(input.to.street1);
  const fromStreet = splitStreetHouse(from.street1);
  const toName = [input.to.name, input.to.surname].filter(Boolean).join(" ").trim() || "Cliente";
  const fromName = [from.name, from.surname].filter(Boolean).join(" ").trim();

  // Path default — override con SPEDIRE_CREATE_PATH quando hai le docs.
  const path = envStr("SPEDIRE_CREATE_PATH", "/v1/shipments");

  const body = {
    serviceId: input.serviceId,
    service_id: input.serviceId,
    reference: (input.customReference || "").slice(0, 40) || undefined,
    content: input.content.slice(0, 50) || "Abbigliamento",
    contentValue: Math.round(input.contentValue * 100) / 100,
    currency: "EUR",
    weight: weightKg,
    packages: input.packages,
    sender: {
      name: fromName,
      company: from.company,
      address: fromStreet.address,
      house_number: fromStreet.house_number,
      street: from.street1,
      city: from.city,
      zip: from.zip_code,
      country: from.country,
      phone: from.phone,
      email: from.email,
    },
    recipient: {
      name: toName,
      company: input.to.company,
      address: toStreet.address,
      house_number: toStreet.house_number,
      street: input.to.street1,
      street2: input.to.street2,
      city: input.to.city,
      zip: normalizeZip(input.to.zip_code),
      state: input.to.state,
      country: normalizeCountry(input.to.country),
      phone: input.to.phone,
      email: input.to.email,
    },
    request_label: true,
  };

  const createRes = await spedireFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Spedire create shipment: ${createRes.status} ${text}`);
  }

  const created = await createRes.json();
  return parseCreateResponse(created);
}
