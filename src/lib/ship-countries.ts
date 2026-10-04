/** EU destinations we quote for shop shipping (IT + UE). */
export const SHIP_COUNTRIES = [
  "IT",
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
] as const;

export type ShipCountry = (typeof SHIP_COUNTRIES)[number];

export function isSupportedShipCountry(code: string) {
  return (SHIP_COUNTRIES as readonly string[]).includes(code.trim().toUpperCase());
}
