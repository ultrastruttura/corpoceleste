import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyPayPalWebhook: vi.fn(),
  fetchPayPalOrder: vi.fn(),
  linesFromOrder: vi.fn(),
  getLedger: vi.fn(),
  claimOrResumeLedger: vi.fn(),
  writeLedger: vi.fn(),
  applyStockDecrementCheckpointed: vi.fn(),
  priceOrderLines: vi.fn(),
  notifyOrder: vi.fn(),
  createShipmentAndLabels: vi.fn(),
  alertMail: vi.fn(),
}));

vi.mock("../../server/paypal.js", () => ({
  paypalWebhookConfigured: () => true,
  verifyPayPalWebhook: mocks.verifyPayPalWebhook,
  fetchPayPalOrder: mocks.fetchPayPalOrder,
  linesFromOrder: mocks.linesFromOrder,
  orderEmailBits: () => ({ labels: ["Tee · ×1 · 45€"], total: "51.50 EUR" }),
  shipContactFromInvoiceId: () => ({ email: "buyer@example.com", phone: "+390000" }),
}));

vi.mock("../../server/github-stock.js", () => ({
  getLedger: mocks.getLedger,
  claimOrResumeLedger: mocks.claimOrResumeLedger,
  writeLedger: mocks.writeLedger,
  applyStockDecrementCheckpointed: mocks.applyStockDecrementCheckpointed,
  LedgerBusyError: class LedgerBusyError extends Error {},
  StockPartialError: class StockPartialError extends Error {
    appliedNotes: string[];
    constructor(message: string, appliedNotes: string[]) {
      super(message);
      this.appliedNotes = appliedNotes;
    }
  },
  consumePaypalHold: vi.fn(async () => null),
}));

vi.mock("../../server/order-pricing.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../server/order-pricing.js")>();
  return {
    ...actual,
    priceOrderLines: mocks.priceOrderLines,
  };
});

vi.mock("../../server/notify-shop.js", () => ({
  notifyOrder: mocks.notifyOrder,
}));

vi.mock("../../server/customer-mail.js", () => ({
  customerOrderText: () => "order",
  localeForCountry: () => "it",
}));

vi.mock("../../server/shop-identity.js", () => ({
  loadShopIdentity: async () => ({
    email: "info@corpoceleste.eu",
    legalName: "Corpoceleste",
  }),
}));

vi.mock("../../server/stock-patch.js", () => ({
  formatCustomerOrderLines: () => "lines",
  formatShopOrderEmail: () => "shop mail",
}));

vi.mock("../../server/sendcloud.js", () => ({
  sendcloudConfigured: () => false,
  createShipmentAndLabels: mocks.createShipmentAndLabels,
  normalizeZip: (z: string) => z,
  packagesForQty: () => [],
  personFromFullName: (n: string) => ({ name: n }),
}));

vi.mock("../../server/mail.js", () => ({
  sendMail: mocks.alertMail,
  mailConfigured: () => false,
}));

vi.mock("../../server/portal/db.js", () => ({
  portalConfigured: () => false,
}));

import handler from "../../api/paypal-webhook";

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers,
  };
}

const captureEvent = {
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    id: "CAP-1",
    amount: { value: "51.50", currency_code: "EUR" },
    supplementary_data: { related_ids: { order_id: "ORDER-1" } },
  },
};

const paypalOrder = {
  id: "ORDER-1",
  purchase_units: [
    {
      amount: { value: "51.50", currency_code: "EUR" },
      shipping: {
        name: { full_name: "Ada" },
        address: {
          address_line_1: "Via Roma 1",
          admin_area_2: "Sarnico",
          postal_code: "24067",
          country_code: "IT",
        },
      },
    },
  ],
};

describe("paypal-webhook handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyPayPalWebhook.mockResolvedValue(true);
    mocks.getLedger.mockResolvedValue(null);
    mocks.linesFromOrder.mockReturnValue([{ id: "tee", size: "M", qty: 1 }]);
    mocks.fetchPayPalOrder.mockResolvedValue(paypalOrder);
    mocks.priceOrderLines.mockResolvedValue({
      ok: true,
      order: {
        lines: [{ id: "tee", size: "M", qty: 1, title: "Tee", unitPrice: 45, lineTotal: 45 }],
        merchandise: 45,
        shipping: 6.5,
        total: 51.5,
        shipZone: "it",
        shipCountry: "IT",
        shipZip: "24067",
        packlink: {
          serviceId: "poste:std",
          price: 6.5,
          currency: "EUR",
          carrier: "Poste",
          serviceName: "Standard",
        },
      },
    });
    mocks.claimOrResumeLedger.mockResolvedValue({
      action: "process",
      ledger: {
        captureId: "CAP-1",
        lines: [{ id: "tee", size: "M", qty: 1 }],
        status: "processing",
        at: new Date().toISOString(),
      },
    });
    mocks.applyStockDecrementCheckpointed.mockImplementation(async (ledger: { captureId: string }) => ({
      ...ledger,
      stockComplete: true,
      stockAppliedKeys: ["tee:M:1"],
      stockNotes: ["tee M ok"],
      status: "processing",
    }));
    mocks.writeLedger.mockResolvedValue(undefined);
    mocks.notifyOrder.mockResolvedValue(true);
  });

  it("rejects invalid webhook signature", async () => {
    mocks.verifyPayPalWebhook.mockResolvedValue(false);
    const res = mockRes();
    await handler(req(captureEvent) as never, res as never);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Invalid signature" });
    expect(mocks.priceOrderLines).not.toHaveBeenCalled();
    expect(mocks.notifyOrder).not.toHaveBeenCalled();
  });

  it("rejects underpay without fulfilling stock or mail", async () => {
    mocks.priceOrderLines.mockResolvedValue({
      ok: true,
      order: {
        lines: [],
        merchandise: 45,
        shipping: 6.5,
        total: 51.5,
        shipZone: "it",
        shipCountry: "IT",
        shipZip: "24067",
        packlink: {
          serviceId: "poste:std",
          price: 6.5,
          currency: "EUR",
          carrier: "Poste",
          serviceName: "Standard",
        },
      },
    });
    const under = {
      ...captureEvent,
      resource: {
        ...captureEvent.resource,
        amount: { value: "10.00", currency_code: "EUR" },
      },
    };
    const res = mockRes();
    await handler(req(under) as never, res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, rejected: "underpay" });
    expect(mocks.applyStockDecrementCheckpointed).not.toHaveBeenCalled();
    expect(mocks.notifyOrder).not.toHaveBeenCalled();
    expect(mocks.createShipmentAndLabels).not.toHaveBeenCalled();
  });

  it("short-circuits duplicate completed captures", async () => {
    mocks.getLedger.mockResolvedValue({
      captureId: "CAP-1",
      lines: [],
      status: "done",
      at: "2026-01-01T00:00:00.000Z",
      stockComplete: true,
    });
    const res = mockRes();
    await handler(req(captureEvent) as never, res as never);
    expect(res.body).toEqual({ ok: true, duplicate: true });
    expect(mocks.fetchPayPalOrder).not.toHaveBeenCalled();
    expect(mocks.priceOrderLines).not.toHaveBeenCalled();
  });

  it("happy path: verifies, prices, decrements stock, notifies", async () => {
    const res = mockRes();
    await handler(req(captureEvent) as never, res as never);
    expect(mocks.verifyPayPalWebhook).toHaveBeenCalled();
    expect(mocks.priceOrderLines).toHaveBeenCalled();
    expect(mocks.applyStockDecrementCheckpointed).toHaveBeenCalled();
    expect(mocks.notifyOrder).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});
