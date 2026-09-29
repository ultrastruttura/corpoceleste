import type { VercelRequest, VercelResponse } from "@vercel/node";
import { customerOrderText } from "../server/customer-mail.js";
import { field, isHoney, parseForm, thanksUrl } from "../server/form-body.js";
import { nowRome, sendMail } from "../server/mail.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const body = parseForm(req);
  const next = thanksUrl(body, "ordine");
  if (isHoney(body)) return res.redirect(303, next);

  const nome = field(body, "nome");
  const email = field(body, "email");
  const ordine = field(body, "ordine");
  if (!nome || !email || !ordine || !email.includes("@")) {
    return res.status(400).send("Missing fields");
  }

  const locale = field(body, "locale") || "it";
  const when = nowRome(locale === "de" ? "de-DE" : locale === "en" ? "en-GB" : "it-IT");
  const shopTo = (process.env.SHOP_EMAIL || "").trim();
  const recap = [
    `Nome: ${nome}`,
    `Email: ${email}`,
    `Telefono: ${field(body, "telefono")}`,
    `Indirizzo: ${field(body, "indirizzo")}`,
    `Città: ${field(body, "citta")}`,
    field(body, "note") ? `Note: ${field(body, "note")}` : "",
    "",
    ordine,
  ]
    .filter(Boolean)
    .join("\n");

  if (shopTo) {
    await sendMail({
      to: shopTo,
      subject: "Ordine shop Corpoceleste (bonifico)",
      text: recap,
    });
  }

  await sendMail({
    to: email,
    subject: "Conferma d’ordine — Corpoceleste",
    text: customerOrderText({ locale, metodo: "Bonifico", ordine: recap, when }),
  });

  return res.redirect(303, next);
}
