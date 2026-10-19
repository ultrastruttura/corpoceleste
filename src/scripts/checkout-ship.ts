/** Checkout shipping helpers — shared address/quote logic (no PayPal mount). */

import { normalizeZip } from "../lib/ship-normalize";

export type CheckoutShipTo = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
};

export type CheckoutQuote = {
  shipping: number;
  country: string;
  zip: string;
  serviceId: string | number;
  carrier: string;
};

export function buildShipTo(input: {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  country: string;
}): CheckoutShipTo {
  const country = String(input.country || "IT").toUpperCase();
  let province = String(input.province || "").trim().toUpperCase();
  if (country === "IT") province = province.slice(0, 2);
  return {
    fullName: String(input.fullName || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    street: String(input.street || "").trim(),
    city: String(input.city || "").trim(),
    province,
  };
}

export function hasCompleteAddress(a: CheckoutShipTo) {
  return Boolean(a.fullName && a.email.includes("@") && a.street && a.city);
}

export async function lookupCityFromZip(
  country: string,
  zip: string,
): Promise<{ city: string; province: string } | null> {
  const cc = country.toUpperCase();
  const z = normalizeZip(zip, cc);
  if (cc === "IT") {
    if (!/^\d{5}$/.test(z)) return null;
  } else if (z.length < 3) {
    return null;
  }
  try {
    const res = await fetch(
      `https://api.zippopotam.us/${cc.toLowerCase()}/${encodeURIComponent(z)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      places?: Array<{
        "place name"?: string;
        state?: string;
        "state abbreviation"?: string;
      }>;
    };
    const place = data.places?.[0];
    if (!place) return null;
    const city = String(place["place name"] || "").trim();
    const abbr = String(place["state abbreviation"] || "").trim();
    const state = String(place.state || "").trim();
    let province = "";
    if (cc === "IT" && /^[A-Za-z]{2}$/.test(abbr)) province = abbr.toUpperCase();
    else if (abbr || state) province = (abbr || state).slice(0, 40);
    if (!city && !province) return null;
    return { city, province };
  } catch {
    return null;
  }
}

export async function requestShippingQuote(opts: {
  apiBase: string;
  country: string;
  zip: string;
  city?: string;
  province?: string;
  lines: Array<{ id: string; size: string; qty: number }>;
}): Promise<CheckoutQuote | null> {
  const country = opts.country.toUpperCase();
  const zip = normalizeZip(opts.zip, country);
  const res = await fetch(`${opts.apiBase}/api/shipping-quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      country,
      zip,
      city: opts.city || undefined,
      province: opts.province || undefined,
      lines: opts.lines,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    shipping?: string;
    country?: string;
    zip?: string;
    serviceId?: string | number;
    carrier?: string;
  };
  const shipping = Number(data.shipping);
  const serviceId =
    data.serviceId == null || data.serviceId === ""
      ? ""
      : typeof data.serviceId === "number"
        ? data.serviceId
        : String(data.serviceId).trim();
  if (!Number.isFinite(shipping) || serviceId === "" || serviceId === 0) return null;
  return {
    shipping,
    country: String(data.country || country).toUpperCase(),
    zip: normalizeZip(String(data.zip || zip), country),
    serviceId,
    carrier: String(data.carrier || ""),
  };
}
