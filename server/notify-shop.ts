import { sendMail } from "./mail.js";

/** Shop + customer transactional mail. Resend only — no FormSubmit copy to the buyer. */
export async function notifyOrder(opts: {
  shopSubject: string;
  shopBody: string;
  customerTo?: string;
  customerSubject: string;
  customerBody: string;
}): Promise<boolean> {
  const shop = (process.env.SHOP_EMAIL || "").trim();
  let ok = true;
  if (shop) {
    ok = (await sendMail({ to: shop, subject: opts.shopSubject, text: opts.shopBody })).ok && ok;
  } else {
    console.warn("SHOP_EMAIL not set — skip shop notify");
    ok = false;
  }
  const customer = (opts.customerTo || "").trim();
  if (customer) {
    ok =
      (
        await sendMail({
          to: customer,
          subject: opts.customerSubject,
          text: opts.customerBody,
        })
      ).ok && ok;
  }
  return ok;
}
