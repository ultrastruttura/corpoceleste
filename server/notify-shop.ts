/** Server-side shop email via FormSubmit (PayPal webhook). */
export async function notifyShopOrder(opts: {
  subject: string;
  ordine: string;
  metodo?: string;
  /** Copia al cliente: conferma d'ordine su supporto durevole. */
  copyTo?: string;
}): Promise<boolean> {
  const email = (process.env.SHOP_EMAIL || "").trim();
  if (!email) {
    console.warn("SHOP_EMAIL not set — skip order notify");
    return false;
  }

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: opts.subject,
        _captcha: "false",
        _template: "table",
        ...(opts.copyTo ? { _cc: opts.copyTo } : {}),
        metodo: opts.metodo || "PayPal",
        ordine: opts.ordine,
      }),
    });
    if (!res.ok) {
      console.error("FormSubmit notify failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("FormSubmit notify error", err);
    return false;
  }
}
