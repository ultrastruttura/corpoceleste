/**
 * Sendcloud API v3 — quote cheapest home delivery + announce shipment/labels.
 * Docs: https://sendcloud.dev — Basic Auth (public:secret).
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
  /** shipping_option_code (es. postnl:standard). */
  serviceId: string;
  price: number;
  currency: string;
  carrier: string;
  serviceName: string;
  transitDays?: string;
  contractId?: number;
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

export function normalizeCountry(code: string | undefined | null) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Normalizza CAP/postcode.
 * IT: 5 cifre. Altri UE: lettere/cifre/trattini e un solo spazio.
 */
export function normalizeZip(zip: string | undefined | null, country?: string) {
  let z = String(zip || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
  const cc = normalizeCountry(country);
  if (cc === "IT") z = z.replace(/\s+/g, "").replace(/[^0-9]/g, "").slice(0, 5);
  else z = z.replace(/[^A-Z0-9 -]/g, "").slice(0, 22);
  return z;
}

/**
 * Sendcloud `state_province_code` when the carrier needs it.
 * Italy: omit — Sendcloud rejects bare sigle (BG) and IT does not require the field for quotes.
 */
export function provinceForLabel(country: string, province: string | undefined | null) {
  const cc = normalizeCountry(country) || "IT";
  if (cc === "IT") return "";
  let p = String(province || "")
    .trim()
    .toUpperCase();
  if (!p) return "";
  if (p.startsWith(`${cc}-`)) return p.slice(0, 12);
  if (/^[A-Z]{2}$/.test(p)) return `${cc}-${p}`.slice(0, 12);
  return p.slice(0, 40);
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

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
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

function isHomeDelivery(option: Record<string, unknown>): boolean {
  const req = asRecord(option.requirements);
  if (req?.is_service_point_required === true) return false;
  const funcs = asRecord(option.functionalities);
  const lastMile = str(funcs?.last_mile).toLowerCase();
  if (lastMile === "service_point" || lastMile === "parcel_shop") return false;
  // Maglie = pacco, non lettere/documenti (es. sendcloud:letter a 0 €).
  const formFactor = str(funcs?.form_factor).toLowerCase();
  if (formFactor === "letter" || formFactor === "document" || formFactor === "mailbox") {
    return false;
  }
  const code = str(option.code).toLowerCase();
  const name = str(option.name).toLowerCase();
  if (code.includes(":letter") || name.includes("letter") || name.includes("posta")) {
    return false;
  }
  return true;
}

function quotePrice(option: Record<string, unknown>): number | null {
  const quotes = Array.isArray(option.quotes) ? option.quotes : [];
  for (const q of quotes) {
    const row = asRecord(q);
    const price = asRecord(row?.price);
    const total = asRecord(price?.total);
    const n = num(total?.value);
    if (n != null && n >= 0) return Math.round(n * 100) / 100;
  }
  return null;
}

function pickCheapest(quotes: ShippingQuote[]): ShippingQuote | null {
  let best: ShippingQuote | null = null;
  for (const q of quotes) {
    if (!best || q.price < best.price) best = q;
  }
  return best;
}

function parseShippingOptions(data: unknown): ShippingQuote[] {
  const root = asRecord(data);
  const list = Array.isArray(root?.data)
    ? root!.data
    : Array.isArray(data)
      ? data
      : [];
  const out: ShippingQuote[] = [];
  for (const item of list) {
    const o = asRecord(item);
    if (!o || !isHomeDelivery(o)) continue;
    const code = str(o.code);
    const price = quotePrice(o);
    if (!code || price == null) continue;
    const carrier = asRecord(o.carrier);
    const contract = asRecord(o.contract);
    const quotes = Array.isArray(o.quotes) ? o.quotes : [];
    const lead = num(asRecord(quotes[0])?.lead_time);
    out.push({
      serviceId: code,
      price,
      currency: "EUR",
      carrier: str(carrier?.name) || str(carrier?.code) || code,
      serviceName: str(o.name) || code,
      transitDays:
        lead != null && lead > 0 ? String(Math.max(1, Math.ceil(lead / 24))) : undefined,
      contractId: num(contract?.id) ?? undefined,
    });
  }
  return out;
}

export async function quoteCheapest(input: {
  toCountry: string;
  toZip: string;
  toCity?: string;
  toProvince?: string;
  packages: ShipPackage[];
}): Promise<ShippingQuote | null> {
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

  const toCity = (input.toCity || "").trim() || toZip;
  const toProvince = provinceForLabel(toCountry, input.toProvince);

  const fromProvince = provinceForLabel(from.country, from.province);
  const body: Record<string, unknown> = {
    from_address: {
      country_code: from.country,
      postal_code: from.zip_code,
      city: from.city,
      ...(from.street1
        ? (() => {
            const s = splitStreetHouse(from.street1);
            return {
              address_line_1: s.address,
              house_number: s.house_number,
            };
          })()
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
  const options = parseShippingOptions(parsed);
  const best = pickCheapest(options);
  if (!best) {
    const root = asRecord(parsed);
    const rawCount = Array.isArray(root?.data) ? root!.data.length : 0;
    console.error("[SENDCLOUD] shipping-options: no priced home rates", {
      rawCount,
      parsedHome: options.length,
    });
  }
  return best;
}

function labelUrlsFromAnnounce(shipment: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const parcels = Array.isArray(shipment.parcels) ? shipment.parcels : [];
  for (const p of parcels) {
    const parcel = asRecord(p);
    if (!parcel) continue;
    const trackingUrl = str(parcel.tracking_url);
    if (trackingUrl.startsWith("http")) urls.push(trackingUrl);
    const docs = Array.isArray(parcel.documents) ? parcel.documents : [];
    for (const d of docs) {
      const doc = asRecord(d);
      const link = str(doc?.link);
      if (link.startsWith("http")) urls.push(link);
    }
  }
  return [...new Set(urls)];
}

export async function createShipmentAndLabels(input: {
  serviceId: string | number;
  to: ShipAddress;
  packages: ShipPackage[];
  content: string;
  contentValue: number;
  customReference?: string;
  contractId?: number;
}): Promise<ShipShipmentResult> {
  const from = originFromEnv();
  if (!from.street1 || !from.city || !from.zip_code || !from.phone || !from.email) {
    throw new Error("Sendcloud origin incomplete (SENDCLOUD_FROM_* env)");
  }
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

  const body = {
    label_details: {
      mime_type: "application/pdf",
      dpi: 72,
    },
    from_address: addressPayload(
      {
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
      from.province,
    ),
    to_address: addressPayload(input.to, toProvince),
    ship_with: {
      type: "shipping_option_code",
      properties: shipWithProps,
    },
    order_number: merchantReference,
    total_order_price: {
      currency: "EUR",
      value: (Math.round(input.contentValue * 100) / 100).toFixed(2),
    },
    parcels: parcelsPayload(input.packages).map((p) => ({
      ...p,
      parcel_items: [
        {
          description: clip(input.content || "Abbigliamento", 100),
          quantity: 1,
          weight: p.weight,
          price: {
            value: (Math.round(input.contentValue * 100) / 100).toFixed(2),
            currency: "EUR",
          },
          origin_country: from.country,
        },
      ],
    })),
  };

  const createRes = await sendcloudFetch("/shipments/announce", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Sendcloud announce: ${createRes.status} ${text}`);
  }

  const created = asRecord(await createRes.json()) || {};
  const shipment = asRecord(created.data) || created;
  const parcels = Array.isArray(shipment.parcels) ? shipment.parcels : [];
  const first = asRecord(parcels[0]);
  const tracking = str(first?.tracking_number);
  const parcelId = first?.id != null ? String(first.id) : "";
  const shipmentId = shipment.id != null ? String(shipment.id) : "";
  const reference = tracking || parcelId || shipmentId || merchantReference;
  if (!reference) throw new Error("Sendcloud announce: missing id/tracking");

  const labelUrls = labelUrlsFromAnnounce(shipment);

  return {
    reference,
    labelUrls,
    orderReference: shipmentId || undefined,
    merchantReference,
  };
}
