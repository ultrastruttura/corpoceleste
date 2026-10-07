/** Fattura proforma PDF (imballo) — not FatturaPA. */

import { site } from "../../src/data/site.js";
import type { ShopOrder } from "./orders.js";

function pdfEscape(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function toLatin1(text: string) {
  const out: number[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code === 0x20ac) {
      out.push(...Buffer.from("EUR", "ascii"));
      continue;
    }
    const map: Record<string, string> = {
      "’": "'",
      "‘": "'",
      "“": '"',
      "”": '"',
      "–": "-",
      "—": "-",
      "…": "...",
      à: "a",
      è: "e",
      é: "e",
      ì: "i",
      ò: "o",
      ù: "u",
      À: "A",
      È: "E",
      É: "E",
      Ì: "I",
      Ò: "O",
      Ù: "U",
    };
    if (map[ch]) {
      out.push(...Buffer.from(map[ch], "ascii"));
      continue;
    }
    if (code >= 32 && code <= 126) out.push(code);
    else if (code < 256) out.push(code);
    else out.push(63);
  }
  return Buffer.from(out);
}

function money(n: number) {
  return `${n.toFixed(2)} EUR`;
}

function formatWhen(iso: string) {
  const d = new Date(
    iso.includes("T") ? iso : iso.includes(" ") ? iso.replace(" ", "T") + "Z" : `${iso}Z`,
  );
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function pad(s: string, n: number, right = false) {
  const t = s.length > n ? s.slice(0, n) : s;
  return right ? t.padStart(n, " ") : t.padEnd(n, " ");
}

export function buildOrderProformaPdf(order: ShopOrder): Buffer {
  const seller = [
    site.name,
    site.intestatario,
    site.indirizzo || site.sede,
    site.vatId ? `P.IVA ${site.vatId}` : "",
    site.rea ? `REA ${site.rea}` : "",
    site.email,
    site.telefono ? `Tel. ${site.telefono}` : "",
  ].filter(Boolean);

  const customer = [
    order.customer_name || "-",
    order.customer_email,
    order.customer_phone ? `Tel. ${order.customer_phone}` : "",
    ...order.shipping_address.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
  ].filter(Boolean);

  if (!order.shipping_address.trim() && (order.ship_zip || order.ship_country)) {
    customer.push([order.ship_zip, order.ship_country].filter(Boolean).join(" "));
  }

  const textLines: string[] = [
    "CORPOCELESTE",
    "FATTURA PROFORMA",
    "(Documento di accompagnamento — non e' FatturaPA / non ha valore fiscale elettronico)",
    "",
    `N. documento: ${order.number}`,
    `Data: ${formatWhen(order.created_at)}`,
    `Pagamento: ${order.source === "paypal" ? "PayPal" : "Bonifico bancario"}`,
    `Rif. pagamento: ${order.external_id}`,
    "",
    "------------------------------------------------------------------------",
    "CEDENTE / PRESTATORE",
    ...seller.map((s) => `  ${s}`),
    "",
    "CLIENTE / DESTINATARIO",
    ...customer.map((s) => `  ${s}`),
    "------------------------------------------------------------------------",
    "",
    `${pad("Q.ta", 6)}${pad("Descrizione", 34)}${pad("Prezzo", 12, true)}${pad("Importo", 12, true)}`,
    "------------------------------------------------------------------------",
  ];

  for (const item of order.lines) {
    const desc = `${item.title}${item.size ? ` taglia ${item.size}` : ""}`;
    textLines.push(
      `${pad(String(item.qty), 6)}${pad(desc, 34)}${pad(money(item.unitPrice), 12, true)}${pad(money(item.lineTotal), 12, true)}`,
    );
  }

  textLines.push(
    "------------------------------------------------------------------------",
    `${pad("", 40)}${pad("Imponibile merce", 16, true)}${pad(money(order.merchandise), 12, true)}`,
    `${pad("", 40)}${pad("Spedizione", 16, true)}${pad(money(order.shipping), 12, true)}`,
    `${pad("", 40)}${pad("TOTALE", 16, true)}${pad(money(order.total), 12, true)}`,
    "",
    `Pezzi totali: ${order.pieces}`,
  );

  if (order.packlink_ref) textLines.push(`Spedizione Packlink: ${order.packlink_ref}`);
  if (order.notes) textLines.push("", "Note", `  ${order.notes}`);

  textLines.push(
    "",
    "------------------------------------------------------------------------",
    "I prezzi si intendono in euro. Documento generato per imballo e corriere.",
    "Per fattura elettronica formale scrivere a " + site.email + ".",
  );

  const contentParts: Buffer[] = [];
  let y = 800;
  for (const line of textLines) {
    if (y < 40) break;
    const size = line.startsWith("FATTURA") || line === "CORPOCELESTE" ? 14 : 9;
    const escaped = pdfEscape(toLatin1(line).toString("latin1"));
    contentParts.push(
      Buffer.from(`BT /F1 ${size} Tf 40 ${y} Td (${escaped}) Tj ET\n`, "latin1"),
    );
    y -= line.startsWith("FATTURA") || line === "CORPOCELESTE" ? 18 : 12;
  }
  const stream = Buffer.concat(contentParts);

  const obj1 = Buffer.from("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  const obj2 = Buffer.from("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  const obj3 = Buffer.from(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n",
  );
  const obj4 = Buffer.concat([
    Buffer.from(`4 0 obj<< /Length ${stream.length} >>stream\n`),
    stream,
    Buffer.from("\nendstream\nendobj\n"),
  ]);
  const obj5 = Buffer.from(
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  );

  const header = Buffer.from("%PDF-1.4\n");
  const parts = [header, obj1, obj2, obj3, obj4, obj5];
  const objOffsets = [
    0,
    header.length,
    header.length + obj1.length,
    header.length + obj1.length + obj2.length,
    header.length + obj1.length + obj2.length + obj3.length,
    header.length + obj1.length + obj2.length + obj3.length + obj4.length,
  ];

  const body = Buffer.concat(parts);
  const xrefStart = body.length;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += `${String(objOffsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.concat([body, Buffer.from(xref)]);
}
