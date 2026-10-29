import { sendMail } from "./mail.js";

const DEFAULT_SHOP = "info@corpoceleste.eu";

/** Shop inbox that must always get successful-order mail. */
export function shopNotifyTo() {
  return (process.env.SHOP_EMAIL || "").trim() || DEFAULT_SHOP;
}

/** Shop + customer transactional mail. Resend only — no FormSubmit copy to the buyer. */
export async function notifyOrder(opts: {
  shopSubject: string;
  shopBody: string;
  customerTo?: string;
  customerSubject: string;
  customerBody: string;
}): Promise<boolean> {
  const primary = shopNotifyTo();
  const shopRecipients: string[] = [primary];
  if (primary.toLowerCase() !== DEFAULT_SHOP) shopRecipients.push(DEFAULT_SHOP);
  let shopOk = true;
  for (const to of shopRecipients) {
    const sent = await sendMail({
      to,
      subject: opts.shopSubject,
      text: opts.shopBody,
    });
    if (!sent.ok) {
      console.error("notifyOrder: shop mail failed", to, sent.error);
      shopOk = false;
    }
  }
  // Customer mail is best-effort: shop summary must not be blocked if buyer mail fails.
  const customer = (opts.customerTo || "").trim();
  if (customer) {
    const cust = await sendMail({
      to: customer,
      subject: opts.customerSubject,
      text: opts.customerBody,
    });
    if (!cust.ok) {
      console.error("notifyOrder: customer mail failed", cust.error);
    }
  }
  return shopOk;
}
