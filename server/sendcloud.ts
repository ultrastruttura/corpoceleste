/** Sendcloud Free: quote cheapest method, create parcel + label URLs. */

import { isSupportedShipCountry, SHIP_COUNTRIES } from "../src/lib/ship-countries.js";

export { SHIP_COUNTRIES, isSupportedShipCountry };

export type ShipPackage = {
  width: number;
  height: number;
  length: number;
  weight: number;
};

export type ShippingQuote = {
  serviceId: number;
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

const API = "https://panel.sendcloud.sc/api/v2";

export function sendcloudConfigured() {
  return Boolean(publicKey() && secretKey());
}

function publicKey() {
  return (process.env.SENDCLOUD_PUBLIC_KEY || "").trim();
}

function secretKey() {
  return (process.env.SENDCLOUD_SECRET_KEY || "").trim();
}

function envNum(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envStr(name: string, fallback = "") {
  return (process.env[name] || "").trim() || fallback;
}

/** Default shirt parcel; weight scales with qty. */
export function packagesForQty(qty: number): ShipPackage[] {
  const pieces = Math.max(1, Math.floor(qty) || 1);
  const unitW = envNum("SENDCLOUD_PKG_WEIGHT", 0.4);
  const width = envNum("SENDCLOUD_PKG_WIDTH", 35);
  const height = envNum("SENDCLOUD_PKG_HEIGHT", 25);
  const length = envNum("SENDCLOUD_PKG_LENGTH", 8);
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
  const name = envStr("SENDCLOUD_FROM_NAME", "Corpoceleste");
  const parts = name.split(/\s+/);
  return {
    name: parts[0] || "Corpoceleste",
    surname: parts.slice(1).join(" ") || "Studio",
    company: envStr("SENDCLOUD_FROM_COMPANY", "Corpoceleste"),
    street1: envStr("SENDCLOUD_FROM_ADDRESS"),
    zip_code: normalizeZip(envStr("SENDCLOUD_FROM_ZIP")),
    city: envStr("SENDCLOUD_FROM_CITY"),
    country: normalizeCountry(envStr("SENDCLOUD_FROM_COUNTRY", "IT")) || "IT",
    phone: envStr("SENDCLOUD_FROM_PHONE"),
    email: envStr("SENDCLOUD_FROM_EMAIL") || envStr("SHOP_EMAIL"),
  };
}

type MethodCountry = {
  iso_2?: string;
  price?: number;
  lead_time_hours?: number | null;
};

type RawMethod = {
  id?: number;
  name?: string;
  carrier?: string;
  min_weight?: string;
  max_weight?: string;
  service_point_input?: string;
  countries?: MethodCountry[];
};

async function sendcloudFetch(path: string, init?: RequestInit) {
  const pub = publicKey();
  const sec = secretKey();
  if (!pub || !sec) throw new Error("Missing SENDCLOUD_PUBLIC_KEY / SENDCLOUD_SECRET_KEY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Basic ${Buffer.from(`${pub}:${sec}`).toString("base64")}`,
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

function weightOk(method: RawMethod, kg: number) {
  const min = Number(method.min_weight);
  const max = Number(method.max_weight);
  if (Number.isFinite(min) && kg + 1e-9 < min) return false;
  if (Number.isFinite(max) && kg - 1e-9 > max) return false;
  return true;
}

function countryPrice(method: RawMethod, toCountry: string): number | null {
  const list = Array.isArray(method.countries) ? method.countries : [];
  const match = list.find((c) => normalizeCountry(c.iso_2) === toCountry);
  if (!match) return null;
  const n = Number(match.price);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function transitFromHours(hours: number | null | undefined) {
  if (hours == null || !Number.isFinite(hours) || hours <= 0) return undefined;
  const days = Math.max(1, Math.ceil(hours / 24));
  return String(days);
}

/** Split "Via Roma 12" → street + house number (Sendcloud requires both). */
export function splitStreetHouse(street: string): { address: string; house_number: string } {
  const s = street.trim();
  const m = s.match(/^(.*?)[,\s]+(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?)\s*$/);
  if (m) return { address: m[1].trim() || s, house_number: m[2] };
  return { address: s || "Via", house_number: "1" };
}

export async function quoteCheapest(input: {
  toCountry: string;
  toZip: string;
  packages: ShipPackage[];
}): Promise<ShippingQuote | null> {
  if (!sendcloudConfigured()) return null;

  const from = originFromEnv();
  if (!from.zip_code) {
    console.error("[SENDCLOUD] SENDCLOUD_FROM_ZIP missing");
    return null;
  }

  const toCountry = normalizeCountry(input.toCountry);
  const toZip = normalizeZip(input.toZip);
  if (!toCountry || !toZip || !isSupportedShipCountry(toCountry)) return null;

  const weightKg = input.packages.reduce((n, p) => n + p.weight, 0);

  const params = new URLSearchParams();
  params.set("to_country", toCountry);
  params.set("from_postal_code", from.zip_code);
  params.set("to_postal_code", toZip);
  const senderAddressId = envStr("SENDCLOUD_SENDER_ADDRESS_ID");
  if (senderAddressId) params.set("sender_address", senderAddressId);

  const res = await sendcloudFetch(`/shipping_methods?${params}`);
  if (!res.ok) {
    console.error("[SENDCLOUD] shipping_methods", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as { shipping_methods?: RawMethod[] };
  const methods = Array.isArray(data.shipping_methods) ? data.shipping_methods : [];

  let best: ShippingQuote | null = null;
  for (const method of methods) {
    const serviceId = Number(method.id);
    if (!Number.isFinite(serviceId)) continue;
    if (method.service_point_input === "required") continue;
    if (!weightOk(method, weightKg)) continue;
    const price = countryPrice(method, toCountry);
    if (price == null) continue;
    const country = (method.countries || []).find((c) => normalizeCountry(c.iso_2) === toCountry);
    const quote: ShippingQuote = {
      serviceId,
      price,
      currency: "EUR",
      carrier: String(method.carrier || "").trim(),
      serviceName: String(method.name || "").trim(),
      transitDays: transitFromHours(country?.lead_time_hours),
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

function labelUrlsFromParcel(parcel: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const label = parcel.label as { normal_printer?: unknown; label_printer?: unknown } | undefined;
  for (const key of ["normal_printer", "label_printer"] as const) {
    const arr = label?.[key];
    if (Array.isArray(arr)) {
      for (const u of arr) {
        const s = String(u || "").trim();
        if (s) urls.push(s);
      }
    }
  }
  return [...new Set(urls)];
}

export async function createShipmentAndLabels(input: {
  serviceId: number;
  to: ShipAddress;
  packages: ShipPackage[];
  content: string;
  contentValue: number;
  customReference?: string;
}): Promise<ShipShipmentResult> {
  const from = originFromEnv();
  if (!from.street1 || !from.city || !from.zip_code || !from.phone || !from.email) {
    throw new Error("Sendcloud origin incomplete (SENDCLOUD_FROM_* env)");
  }

  const weightKg = Math.max(
    0.001,
    Math.round(input.packages.reduce((n, p) => n + p.weight, 0) * 1000) / 1000,
  );
  const toStreet = splitStreetHouse(input.to.street1);
  const fromStreet = splitStreetHouse(from.street1);
  const toName = [input.to.name, input.to.surname].filter(Boolean).join(" ").trim() || "Cliente";

  const parcel: Record<string, unknown> = {
    name: toName,
    company_name: input.to.company || undefined,
    address: toStreet.address,
    house_number: toStreet.house_number,
    address_2: input.to.street2 || undefined,
    city: input.to.city,
    postal_code: normalizeZip(input.to.zip_code),
    country: normalizeCountry(input.to.country),
    telephone: input.to.phone,
    email: input.to.email,
    weight: weightKg.toFixed(3),
    order_number: (input.customReference || "").slice(0, 40) || undefined,
    request_label: true,
    shipment: { id: input.serviceId },
    shipping_method_checkout_name: input.content.slice(0, 50) || "Abbigliamento",
    total_order_value: String(Math.round(input.contentValue * 100) / 100),
    total_order_value_currency: "EUR",
    from_name: [from.name, from.surname].filter(Boolean).join(" ").trim(),
    from_company_name: from.company || undefined,
    from_address_1: fromStreet.address,
    from_house_number: fromStreet.house_number,
    from_city: from.city,
    from_postal_code: from.zip_code,
    from_country: from.country,
    from_telephone: from.phone,
    from_email: from.email,
  };

  const senderAddressId = envStr("SENDCLOUD_SENDER_ADDRESS_ID");
  if (senderAddressId) parcel.sender_address = Number(senderAddressId) || senderAddressId;

  const createRes = await sendcloudFetch("/parcels", {
    method: "POST",
    body: JSON.stringify({ parcel }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Sendcloud create parcel: ${createRes.status} ${text}`);
  }

  const created = (await createRes.json()) as {
    parcel?: Record<string, unknown>;
    parcels?: Record<string, unknown>[];
  };
  const parcelObj = created.parcel || created.parcels?.[0];
  if (!parcelObj) throw new Error("Sendcloud create parcel: missing parcel");

  const id = parcelObj.id != null ? String(parcelObj.id) : "";
  const tracking = parcelObj.tracking_number != null ? String(parcelObj.tracking_number) : "";
  const reference = tracking || id;
  if (!reference) throw new Error("Sendcloud create parcel: missing id/tracking");

  let labelUrls = labelUrlsFromParcel(parcelObj);
  if (!labelUrls.length && id) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 1500));
      const getRes = await sendcloudFetch(`/parcels/${encodeURIComponent(id)}`);
      if (!getRes.ok) continue;
      const got = (await getRes.json()) as { parcel?: Record<string, unknown> };
      if (got.parcel) {
        labelUrls = labelUrlsFromParcel(got.parcel);
        if (labelUrls.length) break;
      }
    }
  }

  return { reference, labelUrls };
}

export function personFromFullName(fullName: string) {
  return splitPersonName(fullName);
}
