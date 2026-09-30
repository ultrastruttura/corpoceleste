import { euro } from "./db.js";

export type DealCost = {
  label: string;
  amount: number;
  /** If true, amount is per unit sold; if false, fixed and spread over planned_qty. */
  per_unit: boolean;
};

export type SaleLine = {
  qty: number;
  unit_price: number;
};

/**
 * Matches Andrea's prospectus:
 * gross → VAT → production costs (fixed allocated + per-unit) → profit → artist %.
 */
export function computeShare(opts: {
  sales: SaleLine[];
  costs: DealCost[];
  planned_qty: number;
  artist_share_pct: number;
  vat_rate_pct: number;
}) {
  const planned = Math.max(1, Math.floor(opts.planned_qty));
  const soldQty = opts.sales.reduce((s, x) => s + x.qty, 0);
  const gross = euro(opts.sales.reduce((s, x) => s + x.qty * x.unit_price, 0));
  const vatFactor = opts.vat_rate_pct / (100 + opts.vat_rate_pct);
  const vat = euro(gross * vatFactor);

  let variable = 0;
  let fixedTotal = 0;
  for (const c of opts.costs) {
    if (c.per_unit) variable += c.amount * soldQty;
    else fixedTotal += c.amount;
  }
  variable = euro(variable);
  fixedTotal = euro(fixedTotal);
  const fixedAllocated = euro((fixedTotal / planned) * soldQty);
  const costsTotal = euro(variable + fixedAllocated);
  const profit = euro(gross - vat - costsTotal);
  const artistDue = euro((profit * opts.artist_share_pct) / 100);
  const studioShare = euro(profit - artistDue);

  return {
    soldQty,
    planned,
    gross,
    vat,
    variable,
    fixedTotal,
    fixedAllocated,
    costsTotal,
    profit,
    artistDue,
    studioShare,
    artistSharePct: opts.artist_share_pct,
  };
}
