/** Shop legal / payment identity for transactional mail (Vercel). */

import matter from "gray-matter";

const FALLBACK = {
  iban: "IT02C03268223000EM002734005",
  intestatario: "Andrea Baldelli Lorenzo",
  legalName: "Andrea Baldelli Lorenzo",
  vatId: "IT04952110163",
  pec: "andrealorenzobaldelli@pec.it",
  sdiCode: "BA6ET11",
  telefono: "",
  rea: "",
  indirizzo: "Via Moroni 51, Lonno, 24027 Nembro (BG), Italia",
};

export type ShopIdentity = typeof FALLBACK;

/** Load Tina site settings from GitHub when token is present; else fallbacks + env. */
export async function loadShopIdentity(): Promise<ShopIdentity> {
  const fromEnv = {
    iban: (process.env.SHOP_IBAN || "").trim(),
    intestatario: (process.env.SHOP_INTESTATARIO || "").trim(),
    telefono: (process.env.SHOP_TELEFONO || "").trim(),
    rea: (process.env.SHOP_REA || "").trim(),
  };

  let cms: Partial<ShopIdentity> = {};
  if ((process.env.GITHUB_TOKEN || "").trim()) {
    try {
      const { getRepoFile } = await import("./github-stock.js");
      const file = await getRepoFile("content/settings/site.md");
      if (file) {
        const { data } = matter(file.content);
        cms = {
          iban: String(data.iban ?? "").trim(),
          intestatario: String(data.intestatario ?? "").trim(),
          legalName: String(data.legalName ?? "").trim(),
          vatId: String(data.vatId ?? "").trim(),
          pec: String(data.pec ?? "").trim(),
          sdiCode: String(data.sdiCode ?? "").trim(),
          telefono: String(data.telefono ?? "").trim(),
          rea: String(data.rea ?? "").trim(),
          indirizzo: String(data.indirizzo ?? "").trim(),
        };
      }
    } catch (err) {
      console.warn("shop-identity: CMS read failed", err);
    }
  }

  return {
    iban: cms.iban || fromEnv.iban || FALLBACK.iban,
    intestatario: cms.intestatario || fromEnv.intestatario || FALLBACK.intestatario,
    legalName: cms.legalName || FALLBACK.legalName,
    vatId: cms.vatId || FALLBACK.vatId,
    pec: cms.pec || FALLBACK.pec,
    sdiCode: cms.sdiCode || FALLBACK.sdiCode,
    telefono: cms.telefono || fromEnv.telefono || FALLBACK.telefono,
    rea: cms.rea || fromEnv.rea || FALLBACK.rea,
    indirizzo: cms.indirizzo || FALLBACK.indirizzo,
  };
}
