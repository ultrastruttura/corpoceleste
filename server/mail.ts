/** Transactional mail from Vercel (Resend). No FormSubmit. */

function fromAddress() {
  const raw = (process.env.MAIL_FROM || process.env.SHOP_EMAIL || "").trim();
  if (!raw) return "";
  return raw.includes("<") ? raw : `Corpoceleste <${raw}>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const key = (process.env.RESEND_API_KEY || "").trim();
  const from = fromAddress();
  const to = opts.to.trim();
  if (!key || !from || !to) {
    console.warn("sendMail skipped: missing RESEND_API_KEY, MAIL_FROM/SHOP_EMAIL, or recipient");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      console.error("Resend failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend error", err);
    return false;
  }
}

export function siteBase() {
  return (process.env.SITE_URL || "https://ultrastruttura.github.io/corpoceleste").replace(/\/$/, "");
}

export function nowRome(locale = "it-IT") {
  return new Date().toLocaleString(locale, { timeZone: "Europe/Rome" });
}
