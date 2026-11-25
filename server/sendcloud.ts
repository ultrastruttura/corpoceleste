/**
 * Sendcloud API v3 — quote home delivery (prefer dropoff) + create incoming order (no label).
 * Docs: https://sendcloud.dev — Basic Auth (public:secret).
 */

import { isSupportedShipCountry, SHIP_COUNTRIES } from "../src/lib/ship-countries.js";
import { normalizeCountry, normalizeZip } from "../src/lib/ship-normalize.js";
import {
  parseShippingOptions,
  selectQuote,
  type QuoteSelection,
  type ShippingQuote,
} from "./sendcloud/quote-select.js";

export { SHIP_COUNTRIES, isSupportedShipCountry, normalizeCountry, normalizeZip };
export type { QuoteSelection, ShippingQuote };

export type ShipPackage = {
  width: number;
  height: number;
  length: number;
  weight: number;
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
  orderReference?: string;
  merchantReference?: string;
};

export type GeoHit = {
  city: string;
  province: string;
  postcode: string;
};

const API_V3 = "https://panel.sendcloud.sc/api/v3";

function envNum(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envStr(name: string, fallback = "") {
  return (process.env[name] || "").trim() || fallback;
}

function publicKey() {
  return envStr("SENDCLOUD_PUBLIC_KEY");
}

function secretKey() {
  return envStr("SENDCLOUD_SECRET_KEY");
}

export function sendcloudConfigured() {
  return Boolean(publicKey() && secretKey());
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

/**
 * Sendcloud `state_province_code` when useful (ISO 3166-2).
 * IT: always omit (API rejects BG / IT-BG for domestic quotes).
 * DE/US/CA/AU: prefer CC-XX. Other EU: omit unless already ISO-shaped.
 */
export function provinceForLabel(country: string, province: string | undefined | null) {
  const cc = normalizeCountry(country) || "IT";
  if (cc === "IT") return "";
  let p = String(province || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
  if (!p) return "";
  if (p.startsWith(`${cc}-`)) return p.slice(0, 12);
  const needsState = new Set(["DE", "US", "CA", "AU", "MX", "BR"]);
  if (needsState.has(cc) && /^[A-Z]{2}$/.test(p)) return `${cc}-${p}`;
  if (/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(p)) return p.slice(0, 12);
  // Avoid sending raw Italian-style sigle / city names to EU carriers.
  return "";
}

function clip(s: string, max: number) {
  return s.trim().slice(0, max);
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

export function originFromEnv(): ShipAddress & { province: string } {
  const name = envStr("SENDCLOUD_FROM_NAME", "Corpoceleste");
  const parts = name.split(/\s+/);
  return {
    name: parts[0] || "Corpoceleste",
    surname: parts.slice(1).join(" ") || "Studio",
    company: envStr("SENDCLOUD_FROM_COMPANY", "Corpoceleste"),
    street1: envStr("SENDCLOUD_FROM_ADDRESS"),
    zip_code: normalizeZip(envStr("SENDCLOUD_FROM_ZIP"), envStr("SENDCLOUD_FROM_COUNTRY", "IT")),
    city: envStr("SENDCLOUD_FROM_CITY"),
    state: envStr("SENDCLOUD_FROM_PROVINCE"),
    province: envStr("SENDCLOUD_FROM_PROVINCE"),
    country: normalizeCountry(envStr("SENDCLOUD_FROM_COUNTRY", "IT")) || "IT",
    phone: envStr("SENDCLOUD_FROM_PHONE"),
    email: envStr("SENDCLOUD_FROM_EMAIL") || envStr("SHOP_EMAIL"),
  };
}

/** Split "Via Roma 12" → street + house number (Sendcloud requires both). */
export function splitStreetHouse(street: string): { address: string; house_number: string } {
  const s = street.trim();
  const m = s.match(/^(.*?)[,\s]+(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?)\s*$/);
  if (m) return { address: m[1].trim() || s, house_number: m[2] };
  return { address: s || "Via", house_number: "1" };
}

function basicAuthHeader() {
  const pub = publicKey();
  const sec = secretKey();
  if (!pub || !sec) throw new Error("Missing SENDCLOUD_PUBLIC_KEY / SENDCLOUD_SECRET_KEY");
  return `Basic ${Buffer.from(`${pub}:${sec}`).toString("base64")}`;
}

async function sendcloudFetch(path: string, init?: RequestInit) {
  const url = path.startsWith("http")
    ? path
    : `${API_V3}${path.startsWith("/") ? "" : "/"}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Authorization: basicAuthHeader(),
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

/**
 * Sendcloud has no CAP→city geo like Spedire; city comes from checkout.
 * Kept so callers can no-op safely.
 */
export async function resolvePostcode(
  _country: string,
  _postcode: string,
): Promise<GeoHit | null> {
  return null;
}

function parcelsPayload(packages: ShipPackage[]) {
  return packages.map((p) => ({
    dimensions: {
      length: String(Math.max(1, Math.round(p.length))),
      width: String(Math.max(1, Math.round(p.width))),
      height: String(Math.max(1, Math.round(p.height))),
      unit: "cm",
    },
    weight: {
      value: (Math.max(0.1, Math.round(p.weight * 1000) / 1000)).toFixed(3),
      unit: "kg",
    },
  }));
}

function addressPayload(
  addr: ShipAddress,
  province: string,
): Record<string, unknown> {
  const street = splitStreetHouse(addr.street1);
  const fullName =
    [addr.name, addr.surname].filter(Boolean).join(" ").trim() || "Cliente";
  const out: Record<string, unknown> = {
    name: clip(fullName, 80),
    address_line_1: street.address,
    house_number: street.house_number,
    postal_code: normalizeZip(addr.zip_code, addr.country),
    city: addr.city.trim() || normalizeZip(addr.zip_code, addr.country),
    country_code: normalizeCountry(addr.country),
    phone_number: addr.phone.trim(),
    email: addr.email.trim(),
  };
  if (addr.company) out.company_name = clip(addr.company, 80);
  if (addr.street2) out.address_line_2 = clip(addr.street2, 80);
  if (province) out.state_province_code = province;
  return out;
}

function preferDropoff(): boolean {
  // Default on: etichetta per portare il pacco in posta (no ritiro corriere in studio).
  return envStr("SENDCLOUD_PREFER_DROPOFF", "1") !== "0";
}

export async function quoteCheapest(input: {
  toCountry: string;
  toZip: string;
  toCity?: string;
  toProvince?: string;
  packages: ShipPackage[];
}): Promise<ShippingQuote | null> {
  const sel = await quoteShipping(input);
  return sel?.chosen ?? null;
}

/** Full selection: preferred dropoff (bring to Poste) vs pickup comparison. */
export async function quoteShipping(input: {
  toCountry: string;
  toZip: string;
  toCity?: string;
  toProvince?: string;
  packages: ShipPackage[];
}): Promise<QuoteSelection | null> {
  if (!sendcloudConfigured()) return null;

  const from = originFromEnv();
  if (!from.zip_code || !from.city) {
    console.error("[SENDCLOUD] SENDCLOUD_FROM_ZIP / SENDCLOUD_FROM_CITY missing");
    return null;
  }

  const toCountry = normalizeCountry(input.toCountry);
  const toZip = normalizeZip(input.toZip, toCountry);
  if (!toCountry || !toZip || !isSupportedShipCountry(toCountry)) return null;
  if (toCountry === "IT" && !/^\d{5}$/.test(toZip)) return null;

  // Estero: città reale migliora i listini zonali; fallback CAP solo se manca.
  const toCity = (input.toCity || "").trim() || toZip;
  const toProvince = provinceForLabel(toCountry, input.toProvince);
  const weightKg = input.packages.reduce((n, p) => n + p.weight, 0);

  const fromProvince = provinceForLabel(from.country, from.province);
  const fromStreet = from.street1 ? splitStreetHouse(from.street1) : null;
  const body: Record<string, unknown> = {
    from_address: {
      country_code: from.country,
      postal_code: from.zip_code,
      city: from.city,
      ...(fromStreet
        ? {
            address_line_1: fromStreet.address,
            house_number: fromStreet.house_number,
          }
        : {}),
      ...(fromProvince ? { state_province_code: fromProvince } : {}),
    },
    to_address: {
      country_code: toCountry,
      postal_code: toZip,
      city: toCity,
      ...(toProvince ? { state_province_code: toProvince } : {}),
    },
    parcels: parcelsPayload(input.packages),
    calculate_quotes: true,
  };

  const res = await sendcloudFetch("/shipping-options", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[SENDCLOUD] shipping-options", res.status, text);
    throw new Error(`Sendcloud ${res.status}: ${text.slice(0, 180)}`);
  }

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new Error("Sendcloud shipping-options: invalid JSON");
  }
  const options = parseShippingOptions(parsed, weightKg);
  const selected = selectQuote(options, preferDropoff());
  if (!selected) {
    const root = asRecord(parsed);
    const rawCount = Array.isArray(root?.data) ? root!.data.length : 0;
    console.error("[SENDCLOUD] shipping-options: no priced home rates", {
      rawCount,
      parsedHome: options.length,
      toCountry,
      toZip,
      weightKg,
    });
    return null;
  }
  console.info("[SENDCLOUD] quote", {
    chosen: selected.chosen.serviceId,
    price: selected.chosen.price,
    firstMile: selected.chosen.firstMile,
    pickup: selected.cheapestPickup?.price ?? null,
    dropoff: selected.cheapestDropoff?.price ?? null,
    toCountry,
    toZip,
  });
  return selected;
}

let cachedIntegrationId: number | null = null;

/** API integration id for Orders (“Ordini in entrata”). Env or first /integrations entry. */
export async function resolveIntegrationId(): Promise<number> {
  const fromEnv = Number(envStr("SENDCLOUD_INTEGRATION_ID"));
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  if (cachedIntegrationId != null) return cachedIntegrationId;

  const res = await sendcloudFetch("/integrations");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sendcloud integrations: ${res.status} ${text.slice(0, 180)}`);
  }
  const parsed = asRecord(await res.json()) || {};
  const list = Array.isArray(parsed.data) ? parsed.data : [];
  let chosen: Record<string, unknown> | null = null;
  for (const row of list) {
    const item = asRecord(row);
    if (!item) continue;
    if (str(item.type).toLowerCase() === "api") {
      chosen = item;
      break;
    }
    if (!chosen) chosen = item;
  }
  const id = Number(chosen?.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Sendcloud: missing integration id (set SENDCLOUD_INTEGRATION_ID)");
  }
  cachedIntegrationId = id;
  return id;
}

/**
 * Create order in Sendcloud “Ordini in entrata” without announcing a label.
 * Preferred dropoff shipping_option_code is stored on the order for later label creation.
 */
export async function createIncomingOrder(input: {
  serviceId: string | number;
  to: ShipAddress;
  packages: ShipPackage[];
  content: string;
  contentValue: number;
  customReference?: string;
  contractId?: number;
}): Promise<ShipShipmentResult> {
  if (!input.to.city?.trim()) {
    throw new Error("Sendcloud: missing recipient city");
  }

  const toProvince = provinceForLabel(input.to.country, input.to.state);
  const merchantReference = clip(input.customReference || `ord-${Date.now()}`, 40);
  const optionCode = str(input.serviceId);
  if (!optionCode) throw new Error("Sendcloud: missing shipping_option_code");

  const contractId =
    input.contractId ??
    (envStr("SENDCLOUD_CONTRACT_ID") ? Number(envStr("SENDCLOUD_CONTRACT_ID")) : undefined);

  const shipWithProps: Record<string, unknown> = {
    shipping_option_code: optionCode,
  };
  if (contractId != null && Number.isFinite(contractId)) {
    shipWithProps.contract_id = contractId;
  }

  const priceValue = Math.round(input.contentValue * 100) / 100;
  const weightKg = Math.max(
    0.1,
    Math.round(input.packages.reduce((n, p) => n + p.weight, 0) * 1000) / 1000,
  );
  const integrationId = await resolveIntegrationId();
  const nowIso = new Date().toISOString();

  const order = {
    order_id: merchantReference,
    order_number: merchantReference,
    order_details: {
      integration: { id: integrationId },
      status: { code: "paid", message: "Pagato" },
      order_created_at: nowIso,
      order_items: [
        {
          name: clip(input.content || "Abbigliamento", 100),
          quantity: 1,
          total_price: { value: priceValue, currency: "EUR" },
          measurement: { weight: { value: weightKg, unit: "kg" } },
        },
      ],
      notes: "Porta in posta (dropoff). Crea etichetta da Ordini in entrata.",
    },
    payment_details: {
      total_price: { value: priceValue, currency: "EUR" },
      status: { code: "paid", message: "Paid" },
    },
    customer_details: {
      name: clip(
        [input.to.name, input.to.surname].filter(Boolean).join(" ").trim() || "Cliente",
        80,
      ),
      email: input.to.email.trim(),
      phone_number: input.to.phone.trim(),
    },
    shipping_address: addressPayload(input.to, toProvince),
    shipping_details: {
      is_local_pickup: false,
      delivery_indicator: optionCode,
      measurement: { weight: { value: weightKg, unit: "kg" } },
      ship_with: {
        type: "shipping_option_code",
        properties: shipWithProps,
      },
    },
  };

  const createRes = await sendcloudFetch("/orders", {
    method: "POST",
    body: JSON.stringify([order]),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Sendcloud orders: ${createRes.status} ${text}`);
  }

  const created = asRecord(await createRes.json()) || {};
  const rows = Array.isArray(created.data) ? created.data : [];
  const first = asRecord(rows[0]) || {};
  const scId = first.id != null ? String(first.id) : "";
  const orderId = str(first.order_id) || merchantReference;
  const reference = scId ? `incoming:${scId}` : `incoming:${orderId}`;

  return {
    reference,
    labelUrls: [],
    orderReference: scId || undefined,
    merchantReference: orderId,
  };
}
