/** Local hand pickup (Bergamo area) — no Sendcloud, €0 shipping. */

export const PICKUP_BERGAMO_SERVICE_ID = "pickup-bergamo";

export const PICKUP_BERGAMO = {
  country: "IT",
  zip: "24121",
  city: "Bergamo",
  province: "BG",
  /** Placeholder address for PayPal / order records. */
  street: "Ritiro a mano — da concordare",
  carrier: "Ritiro a mano",
  serviceName: "Ritiro a mano zona Bergamo",
} as const;

export function isHandPickup(serviceId: string | number | undefined | null) {
  return String(serviceId || "").trim() === PICKUP_BERGAMO_SERVICE_ID;
}
