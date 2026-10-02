import { parseOrderLines, parseSku, encodeSku, type OrderLine } from "../src/lib/paypal-lines.js";
import type { PricedOrder } from "./order-pricing.js";
import { money } from "./order-pricing.js";

export type { OrderLine };

type PayPalItem = {
  name?: string;
  sku?: string;
  quantity?: string;
  unit_amount?: { value?: string; currency_code?: string };
};

export type PayPalOrder = {
  id?: string;
  payer?: { email_address?: string };
  purchase_units?: Array<{
    custom_id?: string;
    amount?: {
      value?: string;
      currency_code?: string;
      breakdown?: {
        item_total?: { value?: string; currency_code?: string };
        shipping?: { value?: string; currency_code?: string };
      };
    };
    items?: PayPalItem[];
    shipping?: {
      address?: {
        country_code?: string;
        admin_area_1?: string;
        admin_area_2?: string;
        postal_code?: string;
        address_line_1?: string;
      };
    };
  }>;
};

export function orderEmailBits(order: PayPalOrder): { labels: string[]; total?: string } {
  const unit = order.purchase_units?.[0];
  const labels: string[] = [];
  for (const item of unit?.items ?? []) {
    const name = (item.name || item.sku || "?").trim();
    const qty = item.quantity || "1";
    const price = item.unit_amount?.value;
    labels.push(price ? `${name} · ×${qty} · ${price}€` : `${name} · ×${qty}`);
  }
  const total = unit?.amount?.value
    ? `${unit.amount.value} ${unit.amount.currency_code || "EUR"}`
    : undefined;
  return { labels, total };
}

export function linesFromOrder(order: PayPalOrder): OrderLine[] {
  const unit = order.purchase_units?.[0];
  if (!unit) return [];

  const fromItems: OrderLine[] = [];
  for (const item of unit.items ?? []) {
    if (!item.sku) continue;
    const parsed = parseSku(item.sku);
    if (!parsed) continue;
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    fromItems.push({ id: parsed.id, size: parsed.size, qty });
  }
  if (fromItems.length) return mergeLines(fromItems);

  if (unit.custom_id) return mergeLines(parseOrderLines(unit.custom_id));
  return [];
}

function mergeLines(lines: OrderLine[]): OrderLine[] {
  const map = new Map<string, OrderLine>();
  for (const line of lines) {
    const key = `${line.id}::${line.size}`;
    const prev = map.get(key);
    if (prev) prev.qty += line.qty;
    else map.set(key, { ...line });
  }
  return [...map.values()];
}

export function paypalApiBase() {
  return process.env.PAYPAL_API_BASE?.replace(/\/$/, "") ||
    (process.env.PAYPAL_MODE === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com");
}

export async function paypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET");

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token failed: ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal token missing");
  return data.access_token;
}

export async function fetchPayPalOrder(orderId: string): Promise<PayPalOrder> {
  const token = await paypalAccessToken();
  const res = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`PayPal order fetch failed: ${res.status}`);
  return (await res.json()) as PayPalOrder;
}

/** Create checkout order with catalog prices (server-side). */
export async function createPayPalCheckoutOrder(order: PricedOrder): Promise<string> {
  const token = await paypalAccessToken();
  const res = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "Corpoceleste",
          custom_id: order.lines
            .map((l) => `${l.id}:${l.size}:${l.qty}`)
            .join("|")
            .slice(0, 127),
          amount: {
            currency_code: "EUR",
            value: money(order.total),
            breakdown: {
              item_total: { currency_code: "EUR", value: money(order.merchandise) },
              shipping: { currency_code: "EUR", value: money(order.shipping) },
            },
          },
          items: order.lines.map((l) => ({
            name: `${l.title} (${l.size})`.slice(0, 127),
            sku: encodeSku(l.id, l.size),
            quantity: String(l.qty),
            unit_amount: { currency_code: "EUR", value: money(l.unitPrice) },
            category: "PHYSICAL_GOODS",
          })),
        },
      ],
      application_context: {
        brand_name: "Corpoceleste",
        shipping_preference: "GET_FROM_FILE",
        user_action: "PAY_NOW",
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("PayPal create order missing id");
  return data.id;
}

export async function verifyPayPalWebhook(opts: {
  body: string;
  headers: Record<string, string | string[] | undefined>;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("Missing PAYPAL_WEBHOOK_ID");

  const transmissionId = header(opts.headers, "paypal-transmission-id");
  const transmissionTime = header(opts.headers, "paypal-transmission-time");
  const certUrl = header(opts.headers, "paypal-cert-url");
  const authAlgo = header(opts.headers, "paypal-auth-algo");
  const transmissionSig = header(opts.headers, "paypal-transmission-sig");
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  let webhookEvent: unknown;
  try {
    webhookEvent = JSON.parse(opts.body);
  } catch {
    return false;
  }

  const token = await paypalAccessToken();
  const res = await fetch(`${paypalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

function header(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}
