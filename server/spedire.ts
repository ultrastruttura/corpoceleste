/**
 * SpedirePRO (Alsendo) public API — quote + create-label + get-label.
 * Spec: https://spedirepro.readme.io + OpenAPI (base /public-api, header X-Api-Key).
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
  /** Alias corriere da passare a create-label come `courier` (es. SDA, UPS). */
  serviceId: string;
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
  /** Sigla provincia IT (RM) o stato 2 lettere; obbligatoria in create-label. */
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

const DEFAULT_API_BASE = "https://www.spedirepro.com/public-api";

function envNum(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envStr(name: string, fallback = "") {
  return (process.env[name] || "").trim() || fallback;
}

function apiBase() {
  return envStr("SPEDIRE_API_BASE", DEFAULT_API_BASE).replace(/\/+$/, "");
}

function apiKey() {
  return envStr("SPEDIRE_API_KEY");
}

export function spedireConfigured() {
  return Boolean(apiKey());
}

/** @deprecated prefer spedireConfigured */
export function sendcloudConfigured() {
  return spedireConfigured();
}

/** Default shirt parcel; weight scales with qty. length → depth in API. */
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

/**
 * Normalizza CAP/postcode per SpedirePRO.
 * IT: 5 cifre senza spazi. Altri paesi UE: mantiene lettere/cifre/trattini e un solo spazio
 * (es. UK "SW1A 1AA", NL "1012 AB") — togliere tutti gli spazi rompe le quote estere.
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

/** Province obbligatoria in create-label: IT = sigla; altri paesi = regione o codice ISO. */
export function provinceForLabel(country: string, province: string | undefined | null) {
  const cc = normalizeCountry(country) || "IT";
  const p = String(province || "")
    .trim()
    .toUpperCase();
  if (cc === "IT") return (p.slice(0, 2) || "XX");
  return (p || cc).slice(0, 40);
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
  const name = envStr("SPEDIRE_FROM_NAME", "Corpoceleste");
  const parts = name.split(/\s+/);
  return {
    name: parts[0] || "Corpoceleste",
    surname: parts.slice(1).join(" ") || "Studio",
    company: envStr("SPEDIRE_FROM_COMPANY", "Corpoceleste"),
    street1: envStr("SPEDIRE_FROM_ADDRESS"),
    zip_code: normalizeZip(envStr("SPEDIRE_FROM_ZIP"), envStr("SPEDIRE_FROM_COUNTRY", "IT")),
    city: envStr("SPEDIRE_FROM_CITY"),
    state: envStr("SPEDIRE_FROM_PROVINCE"),
    province: envStr("SPEDIRE_FROM_PROVINCE"),
    country: normalizeCountry(envStr("SPEDIRE_FROM_COUNTRY", "IT")) || "IT",
    phone: envStr("SPEDIRE_FROM_PHONE"),
    email: envStr("SPEDIRE_FROM_EMAIL") || envStr("SHOP_EMAIL"),
  };
}

/** Kept for callers that still import it; Spedire uses full street string. */
export function splitStreetHouse(street: string): { address: string; house_number: string } {
  const s = street.trim();
  const m = s.match(/^(.*?)[,\s]+(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?)\s*$/);
  if (m) return { address: m[1].trim() || s, house_number: m[2] };
  return { address: s || "Via", house_number: "1" };
}

async function spedireFetch(path: string, init?: RequestInit) {
  const key = apiKey();
  if (!key) throw new Error("Missing SPEDIRE_API_KEY");

  const url = path.startsWith("http")
    ? path
    : `${apiBase()}${path.startsWith("/") ? "" : "/"}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "X-Api-Key": key,
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

/** CAP → città/provincia (oggi coperto solo IT; altri paesi → []). */
export async function resolvePostcode(country: string, postcode: string): Promise<GeoHit | null> {
  const cc = normalizeCountry(country);
  const zip = normalizeZip(postcode, cc);
  if (!cc || !zip || !spedireConfigured()) return null;

  const res = await spedireFetch(`/v1/geo/${encodeURIComponent(cc)}/${encodeURIComponent(zip)}`);
  if (!res.ok) {
    console.error("[SPEDIRE] geo", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !data.length) return null;
  const first = asRecord(data[0]);
  if (!first) return null;
  const city = str(first.city);
  if (!city) return null;
  return {
    city,
    province: str(first.province),
    postcode: str(first.postcode) || zip,
  };
}

function packagesPayload(packages: ShipPackage[]) {
  return packages.map((p) => ({
    width: Math.max(1, Math.round(p.width)),
    height: Math.max(1, Math.round(p.height)),
    depth: Math.max(1, Math.round(p.length)),
    weight: Math.max(0.1, Math.round(p.weight * 1000) / 1000),
  }));
}

type RawQuote = {
  id?: string;
  name?: string;
  vendor?: string;
  price?: number;
  departure_type?: string;
  arrival_type?: string;
  pickup_type?: string;
};

function parseHomeQuotes(data: unknown): ShippingQuote[] {
  const list = Array.isArray(data) ? data : [];
  const out: ShippingQuote[] = [];
  for (const item of list) {
    const o = asRecord(item) as RawQuote | null;
    if (!o) continue;
    // Solo domicilio→domicilio: i locker richiedono drop points in create-label.
    if (str(o.departure_type) === "point" || str(o.arrival_type) === "point") continue;
    const id = str(o.id);
    const price = num(o.price);
    if (!id || price == null || price < 0) continue;
    out.push({
      serviceId: id,
      price: Math.round(price * 100) / 100,
      currency: "EUR",
      carrier: str(o.vendor) || id,
      serviceName: str(o.name) || id,
    });
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
  /** Opzionale: se manca, prova /v1/geo (IT) o usa il CAP come city. */
  toCity?: string;
  toProvince?: string;
  packages: ShipPackage[];
}): Promise<ShippingQuote | null> {
  if (!spedireConfigured()) return null;

  const from = originFromEnv();
  if (!from.zip_code || !from.city) {
    console.error("[SPEDIRE] SPEDIRE_FROM_ZIP / SPEDIRE_FROM_CITY missing");
    return null;
  }

  const toCountry = normalizeCountry(input.toCountry);
  const toZip = normalizeZip(input.toZip, toCountry);
  if (!toCountry || !toZip || !isSupportedShipCountry(toCountry)) return null;
  if (toCountry === "IT" && !/^\d{5}$/.test(toZip)) return null;

  let toCity = (input.toCity || "").trim();
  let toProvince = (input.toProvince || "").trim();
  // /v1/geo oggi copre solo l'Italia; per UE la city va dal form checkout.
  if ((!toCity || !toProvince) && toCountry === "IT") {
    try {
      const geo = await resolvePostcode(toCountry, toZip);
      if (geo) {
        toCity = toCity || geo.city;
        toProvince = toProvince || geo.province;
      }
    } catch (err) {
      console.error("[SPEDIRE] geo for quote", err);
    }
  }
  // Preventivo: se manca la city (form non ancora compilato / geo vuoto) usa il CAP.
  // create-label richiede invece la città reale dal checkout.
  if (!toCity) toCity = toZip;
  toProvince = provinceForLabel(toCountry, toProvince);

  const body = {
    from: {
      country: from.country,
      city: from.city,
      postcode: from.zip_code,
      ...(from.province ? { province: from.province } : {}),
    },
    to: {
      country: toCountry,
      city: toCity,
      postcode: toZip,
      ...(toProvince ? { province: toProvince } : {}),
    },
    packages: packagesPayload(input.packages),
  };

  const res = await spedireFetch("/v1/get-quotes", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("[SPEDIRE] get-quotes", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const best = pickCheapest(parseHomeQuotes(data));
  if (!best) {
    console.error("[SPEDIRE] get-quotes: no home-delivery rates");
  }
  return best;
}

async function lookupShipment(refs: {
  merchantReference?: string;
  orderReference?: string;
  reference?: string;
}): Promise<Record<string, unknown> | null> {
  const body: Record<string, string> = {};
  if (refs.reference) body.reference = refs.reference;
  if (refs.orderReference) body.order_reference = refs.orderReference;
  if (refs.merchantReference) body.merchant_reference = refs.merchantReference;
  if (!Object.keys(body).length) return null;

  const res = await spedireFetch("/v1/shipment", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = asRecord(await res.json());
  return data;
}

async function fetchLabelUrl(reference: string): Promise<string | null> {
  const res = await spedireFetch("/v1/get-label", {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
  if (!res.ok) {
    console.error("[SPEDIRE] get-label", res.status, await res.text());
    return null;
  }
  const data = asRecord(await res.json());
  const url = str(data?.url);
  return url.startsWith("http") ? url : null;
}

async function waitForReferenceAndLabel(opts: {
  merchantReference: string;
  orderReference: string;
}): Promise<{ reference: string; labelUrls: string[] }> {
  let reference = "";
  const labelUrls: string[] = [];

  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2000));
    const shipment = await lookupShipment({
      merchantReference: opts.merchantReference,
      orderReference: opts.orderReference,
    });
    const ref = str(shipment?.reference);
    if (!ref) continue;
    reference = ref;
    const url = await fetchLabelUrl(ref);
    if (url) {
      labelUrls.push(url);
      break;
    }
  }

  return { reference, labelUrls };
}

function partyPayload(addr: ShipAddress, province: string) {
  const fullName = [addr.name, addr.surname].filter(Boolean).join(" ").trim() || "Cliente";
  return {
    name: clip(fullName, 27),
    ...(addr.company ? { attention_name: clip(addr.company, 22) } : {}),
    country: normalizeCountry(addr.country),
    city: addr.city.trim(),
    postcode: normalizeZip(addr.zip_code, addr.country),
    province: provinceForLabel(addr.country, province),
    street: addr.street1.trim(),
    ...(addr.street2 ? { address_2: clip(addr.street2, 85) } : {}),
    email: addr.email.trim(),
    phone: addr.phone.trim(),
  };
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
  if (!from.street1 || !from.city || !from.zip_code || !from.phone || !from.email || !from.province) {
    throw new Error("Spedire origin incomplete (SPEDIRE_FROM_* incl. SPEDIRE_FROM_PROVINCE)");
  }

  let toProvince = (input.to.state || "").trim();
  if (!toProvince && normalizeCountry(input.to.country) === "IT") {
    const geo = await resolvePostcode(input.to.country, input.to.zip_code);
    toProvince = geo?.province || "";
  }
  toProvince = provinceForLabel(input.to.country, toProvince);
  if (!input.to.city?.trim()) {
    throw new Error("Spedire: missing recipient city");
  }

  const merchantReference = clip(input.customReference || `ord-${Date.now()}`, 64);
  const courier = str(input.serviceId);

  const body = {
    merchant_reference: merchantReference,
    include_return_label: false,
    include_price: true,
    book_pickup: false,
    courier_fallback: !courier,
    ...(courier ? { courier } : {}),
    sender: partyPayload(
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
    receiver: partyPayload(input.to, toProvince),
    packages: packagesPayload(input.packages),
    content: {
      description: clip(input.content || "Abbigliamento", 100),
      amount: Math.round(input.contentValue * 100) / 100,
    },
  };

  const createRes = await spedireFetch("/v1/create-label", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Spedire create-label: ${createRes.status} ${text}`);
  }

  const created = asRecord(await createRes.json()) || {};
  const orderReference = str(created.order);
  const waited = await waitForReferenceAndLabel({
    merchantReference,
    orderReference,
  });

  // Reference definitivo se pronto; altrimenti order / merchant per lookup successivo / webhook.
  const reference =
    waited.reference || orderReference || merchantReference;
  if (!reference) throw new Error("Spedire create-label: missing order/reference");

  return {
    reference,
    labelUrls: waited.labelUrls,
    orderReference: orderReference || undefined,
    merchantReference,
  };
}
