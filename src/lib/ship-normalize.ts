/** Country / CAP helpers shared by checkout UI and server shipping. */

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
