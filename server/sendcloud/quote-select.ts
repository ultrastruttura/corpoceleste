/**
 * Pure Sendcloud shipping-options parse + pickup/dropoff selection.
 * No HTTP / env — unit-testable.
 */

export type ShippingQuote = {
  /** shipping_option_code (es. postnl:standard). */
  serviceId: string;
  price: number;
  currency: string;
  carrier: string;
  serviceName: string;
  transitDays?: string;
  contractId?: number;
  /** pickup = ritiro in studio; dropoff = Andrea porta al punto; either = entrambi. */
  firstMile?: "pickup" | "dropoff" | "either" | "unknown";
};

export type QuoteSelection = {
  chosen: ShippingQuote;
  cheapestPickup: ShippingQuote | null;
  cheapestDropoff: ShippingQuote | null;
};

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

export function isParcelHomeDelivery(option: Record<string, unknown>): boolean {
  const req = asRecord(option.requirements);
  if (req?.is_service_point_required === true) return false;
  const funcs = asRecord(option.functionalities);
  const lastMile = str(funcs?.last_mile).toLowerCase();
  if (lastMile === "service_point" || lastMile === "parcel_shop") return false;
  const formFactor = str(funcs?.form_factor).toLowerCase();
  if (formFactor === "letter" || formFactor === "document" || formFactor === "mailbox") {
    return false;
  }
  const code = str(option.code).toLowerCase();
  const name = str(option.name).toLowerCase();
  if (code.includes(":letter") || /\bletter\b/.test(name) || /\bunstamped\b/.test(name)) {
    return false;
  }
  if (funcs?.returns === true || code.includes(":return") || /\breturn\b/.test(name)) {
    return false;
  }
  return true;
}

export function firstMileOf(option: Record<string, unknown>): ShippingQuote["firstMile"] {
  const code = str(option.code).toLowerCase();
  const funcs = asRecord(option.functionalities);
  const fm = str(funcs?.first_mile).toLowerCase();
  if (code.includes("/dropoff") || fm === "dropoff") return "dropoff";
  if (code.includes("/pickup") || fm === "pickup") return "pickup";
  if (fm === "pickup_dropoff") return "either";
  return "unknown";
}

function weightFits(option: Record<string, unknown>, weightKg: number): boolean {
  const w = asRecord(option.weight);
  const min = num(asRecord(w?.min)?.value);
  const max = num(asRecord(w?.max)?.value);
  if (min != null && weightKg + 1e-9 < min) return false;
  if (max != null && weightKg - 1e-9 > max) return false;
  return true;
}

function quotePrice(option: Record<string, unknown>): number | null {
  const quotes = Array.isArray(option.quotes) ? option.quotes : [];
  for (const q of quotes) {
    const row = asRecord(q);
    const price = asRecord(row?.price);
    const total = asRecord(price?.total);
    const n = num(total?.value);
    if (n != null && n > 0) return Math.round(n * 100) / 100;
  }
  return null;
}

export function pickCheapest(quotes: ShippingQuote[]): ShippingQuote | null {
  let best: ShippingQuote | null = null;
  for (const q of quotes) {
    if (!best || q.price < best.price) best = q;
  }
  return best;
}

export function parseShippingOptions(data: unknown, weightKg: number): ShippingQuote[] {
  const root = asRecord(data);
  const list = Array.isArray(root?.data)
    ? root!.data
    : Array.isArray(data)
      ? data
      : [];
  const out: ShippingQuote[] = [];
  for (const item of list) {
    const o = asRecord(item);
    if (!o || !isParcelHomeDelivery(o)) continue;
    if (!weightFits(o, weightKg)) continue;
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
      firstMile: firstMileOf(o),
    });
  }
  return out;
}

export function selectQuote(
  options: ShippingQuote[],
  preferPickup: boolean,
): QuoteSelection | null {
  if (!options.length) return null;
  const pickupPool = options.filter((q) => q.firstMile === "pickup" || q.firstMile === "either");
  const dropoffPool = options.filter((q) => q.firstMile === "dropoff");
  const cheapestPickup = pickCheapest(pickupPool);
  const cheapestDropoff = pickCheapest(dropoffPool);
  const absoluteCheapest = pickCheapest(options);
  const chosen = preferPickup && cheapestPickup ? cheapestPickup : absoluteCheapest;
  if (!chosen) return null;
  return { chosen, cheapestPickup, cheapestDropoff };
}
