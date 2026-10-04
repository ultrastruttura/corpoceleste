/** Packlink PRO: quote cheapest service, create shipment, fetch labels. */

import { isSupportedShipCountry, SHIP_COUNTRIES } from "../src/lib/ship-countries.js";

export { SHIP_COUNTRIES, isSupportedShipCountry };

export type PacklinkPackage = {
  width: number;
  height: number;
  length: number;
  weight: number;
};

export type PacklinkQuote = {
  serviceId: number;
  price: number;
  currency: string;
  carrier: string;
  serviceName: string;
  transitDays?: string;
};

export type PacklinkAddress = {
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

export type PacklinkShipmentResult = {
  reference: string;
  labelUrls: string[];
};

const API = "https://api.packlink.com";

export function packlinkConfigured() {
  return Boolean((process.env.PACKLINK_API_KEY || "").trim());
}

function apiKey() {
  return (process.env.PACKLINK_API_KEY || "").trim();
}

function envNum(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Default shirt parcel; weight scales with qty. */
export function packagesForQty(qty: number): PacklinkPackage[] {
  const pieces = Math.max(1, Math.floor(qty) || 1);
  const unitW = envNum("PACKLINK_PKG_WEIGHT", 0.4);
  const width = envNum("PACKLINK_PKG_WIDTH", 35);
  const height = envNum("PACKLINK_PKG_HEIGHT", 25);
  const length = envNum("PACKLINK_PKG_LENGTH", 8);
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

export function originFromEnv(): Omit<PacklinkAddress, "name" | "surname" | "phone" | "email"> & {
  name: string;
  surname: string;
  phone: string;
  email: string;
} {
  const name = (process.env.PACKLINK_FROM_NAME || "Corpoceleste").trim();
  const parts = name.split(/\s+/);
  return {
    name: parts[0] || "Corpoceleste",
    surname: parts.slice(1).join(" ") || "Studio",
    company: (process.env.PACKLINK_FROM_COMPANY || "Corpoceleste").trim(),
    street1: (process.env.PACKLINK_FROM_ADDRESS || "").trim(),
    zip_code: normalizeZip(process.env.PACKLINK_FROM_ZIP),
    city: (process.env.PACKLINK_FROM_CITY || "").trim(),
    country: normalizeCountry(process.env.PACKLINK_FROM_COUNTRY || "IT") || "IT",
    phone: (process.env.PACKLINK_FROM_PHONE || "").trim(),
    email: (process.env.PACKLINK_FROM_EMAIL || process.env.SHOP_EMAIL || "").trim(),
  };
}

type RawService = {
  id?: number | string;
  name?: string;
  carrier_name?: string;
  total_price?: number;
  base_price?: number;
  currency?: string;
  transit_time?: string;
  transit_hours?: number;
  price?: { total_price?: number; currency?: string };
};

function servicePrice(s: RawService): number | null {
  const raw = s.price?.total_price ?? s.total_price ?? s.base_price;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

async function packlinkFetch(path: string, init?: RequestInit) {
  const key = apiKey();
  if (!key) throw new Error("Missing PACKLINK_API_KEY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: key,
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function quoteCheapest(input: {
  toCountry: string;
  toZip: string;
  packages: PacklinkPackage[];
}): Promise<PacklinkQuote | null> {
  if (!packlinkConfigured()) return null;

  const from = originFromEnv();
  if (!from.zip_code) {
    console.error("[PACKLINK] PACKLINK_FROM_ZIP missing");
    return null;
  }

  const toCountry = normalizeCountry(input.toCountry);
  const toZip = normalizeZip(input.toZip);
  if (!toCountry || !toZip || !isSupportedShipCountry(toCountry)) return null;

  const params = new URLSearchParams();
  params.set("from[country]", from.country);
  params.set("from[zip]", from.zip_code);
  params.set("to[country]", toCountry);
  params.set("to[zip]", toZip);
  input.packages.forEach((pkg, i) => {
    params.set(`packages[${i}][width]`, String(pkg.width));
    params.set(`packages[${i}][height]`, String(pkg.height));
    params.set(`packages[${i}][length]`, String(pkg.length));
    params.set(`packages[${i}][weight]`, String(pkg.weight));
  });

  const res = await packlinkFetch(`/v1/services?${params}`);
  if (!res.ok) {
    console.error("[PACKLINK] services", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !data.length) return null;

  let best: PacklinkQuote | null = null;
  for (const raw of data as RawService[]) {
    const price = servicePrice(raw);
    const serviceId = Number(raw.id);
    if (price == null || !Number.isFinite(serviceId)) continue;
    const quote: PacklinkQuote = {
      serviceId,
      price,
      currency: String(raw.price?.currency || raw.currency || "EUR"),
      carrier: String(raw.carrier_name || "").trim(),
      serviceName: String(raw.name || "").trim(),
      transitDays: raw.transit_time ? String(raw.transit_time) : undefined,
    };
    if (!best || quote.price < best.price) best = quote;
  }
  return best;
}

function splitPersonName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { name: "Cliente", surname: "Corpoceleste" };
  if (parts.length === 1) return { name: parts[0], surname: "-" };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

export async function createShipmentAndLabels(input: {
  serviceId: number;
  to: PacklinkAddress;
  packages: PacklinkPackage[];
  content: string;
  contentValue: number;
  customReference?: string;
}): Promise<PacklinkShipmentResult> {
  const from = originFromEnv();
  if (!from.street1 || !from.city || !from.zip_code || !from.phone || !from.email) {
    throw new Error("Packlink origin incomplete (FROM_* env)");
  }

  const body = {
    service_id: input.serviceId,
    content: input.content.slice(0, 50) || "Abbigliamento",
    contentvalue: Math.round(input.contentValue * 100) / 100,
    content_second_hand: false,
    contentValue_currency: "EUR",
    priority: false,
    shipment_custom_reference: (input.customReference || "").slice(0, 50) || undefined,
    from: {
      name: from.name,
      surname: from.surname,
      company: from.company,
      street1: from.street1,
      zip_code: from.zip_code,
      city: from.city,
      country: from.country,
      phone: from.phone,
      email: from.email,
    },
    to: {
      name: input.to.name,
      surname: input.to.surname || "-",
      company: input.to.company || undefined,
      street1: input.to.street1,
      street2: input.to.street2 || undefined,
      zip_code: normalizeZip(input.to.zip_code),
      city: input.to.city,
      state: input.to.state || undefined,
      country: normalizeCountry(input.to.country),
      phone: input.to.phone,
      email: input.to.email,
    },
    packages: input.packages,
  };

  const createRes = await packlinkFetch("/v1/shipments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Packlink create shipment: ${createRes.status} ${text}`);
  }

  const created = (await createRes.json()) as { reference?: string };
  const reference = String(created.reference || "").trim();
  if (!reference) throw new Error("Packlink create shipment: missing reference");

  let labelUrls: string[] = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1500));
    const labelRes = await packlinkFetch(`/v1/shipments/${encodeURIComponent(reference)}/labels`);
    if (!labelRes.ok) {
      console.warn("[PACKLINK] labels", labelRes.status, await labelRes.text());
      continue;
    }
    const labels = (await labelRes.json()) as unknown;
    if (Array.isArray(labels)) {
      labelUrls = labels.map((u) => String(u || "").trim()).filter(Boolean);
    } else if (labels && typeof labels === "object" && Array.isArray((labels as { labels?: unknown }).labels)) {
      labelUrls = ((labels as { labels: unknown[] }).labels || [])
        .map((u) => String(u || "").trim())
        .filter(Boolean);
    }
    if (labelUrls.length) break;
  }

  return { reference, labelUrls };
}

export function personFromFullName(fullName: string) {
  return splitPersonName(fullName);
}
