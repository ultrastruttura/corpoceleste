import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  abuseLimit: vi.fn(),
  priceOrderLines: vi.fn(),
  requireSiteOrigin: vi.fn(() => true),
}));

vi.mock("../../server/abuse-limit.js", () => ({
  abuseLimit: mocks.abuseLimit,
}));

vi.mock("../../server/live-catalog.js", () => ({
  listLiveCatalogProducts: vi.fn(async () => []),
}));

vi.mock("../../server/order-pricing.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../server/order-pricing.js")>();
  return {
    ...actual,
    priceOrderLines: mocks.priceOrderLines,
  };
});

vi.mock("../../server/portal/http.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../server/portal/http.js")>();
  return {
    ...actual,
    requireSiteOrigin: mocks.requireSiteOrigin,
  };
});

import handler from "../../api/shipping-quote";

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(k: string, v: string) {
      this.headers[k] = v;
      return this;
    },
    send(body: unknown) {
      this.body = typeof body === "string" ? JSON.parse(body as string) : body;
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

function postReq(body: unknown) {
  return {
    method: "POST",
    body,
    headers: {
      origin: "https://www.corpoceleste.eu",
      "content-type": "application/json",
    },
  };
}

const pricedOk = {
  ok: true as const,
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
      transitDays: "2-3",
      firstMile: "pickup",
    },
    shippingCompare: { pickup: 6.5, dropoff: 5.9 },
  },
};

describe("shipping-quote handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.abuseLimit.mockResolvedValue({ ok: true });
    mocks.requireSiteOrigin.mockReturnValue(true);
    mocks.priceOrderLines.mockResolvedValue(pricedOk);
  });

  it("answers OPTIONS with 204", async () => {
    const res = mockRes();
    await handler({ method: "OPTIONS", headers: {} } as never, res as never);
    expect(res.statusCode).toBe(204);
  });

  it("rejects non-POST (except live_stock GET)", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: {}, headers: {} } as never, res as never);
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: "Method not allowed" });
  });

  it("stops when origin gate fails", async () => {
    mocks.requireSiteOrigin.mockReturnValue(false);
    const res = mockRes();
    await handler(postReq({ country: "IT", zip: "24067", lines: [] }) as never, res as never);
    expect(mocks.priceOrderLines).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mocks.abuseLimit.mockResolvedValue({ ok: false, retryAfterSec: 60 });
    const res = mockRes();
    await handler(
      postReq({ country: "IT", zip: "24067", lines: [{ id: "tee", size: "M", qty: 1 }] }) as never,
      res as never,
    );
    expect(res.statusCode).toBe(429);
    expect(res.body).toMatchObject({ error: "Too many requests", retryAfterSec: 60 });
    expect(mocks.priceOrderLines).not.toHaveBeenCalled();
  });

  it("returns 400 for unsupported country / bad IT zip", async () => {
    const resUs = mockRes();
    await handler(
      postReq({ country: "US", zip: "10001", lines: [{ id: "tee", size: "M", qty: 1 }] }) as never,
      resUs as never,
    );
    expect(resUs.statusCode).toBe(400);
    expect(resUs.body).toEqual({ error: "Invalid shipping destination" });

    const resZip = mockRes();
    await handler(
      postReq({ country: "IT", zip: "24", lines: [{ id: "tee", size: "M", qty: 1 }] }) as never,
      resZip as never,
    );
    expect(resZip.statusCode).toBe(400);
    expect(resZip.body).toEqual({ error: "Invalid shipping destination" });
    expect(mocks.priceOrderLines).not.toHaveBeenCalled();
  });

  it("returns 400 when priceOrderLines rejects (OOS / empty)", async () => {
    mocks.priceOrderLines.mockResolvedValue({ ok: false, error: "Out of stock tee M" });
    const res = mockRes();
    await handler(
      postReq({ country: "IT", zip: "24067", lines: [{ id: "tee", size: "M", qty: 3 }] }) as never,
      res as never,
    );
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Out of stock tee M" });
  });

  it("quotes IT destination with merchandise + shipping = total", async () => {
    const res = mockRes();
    await handler(
      postReq({
        country: "IT",
        zip: "24067",
        city: "Sarnico",
        lines: [{ id: "tee", size: "M", qty: 1 }],
      }) as never,
      res as never,
    );
    expect(res.statusCode).toBe(200);
    const body = res.body as {
      shipping: string;
      merchandise: string;
      total: string;
      country: string;
      zip: string;
      serviceId: string;
      carrier: string;
    };
    expect(body.country).toBe("IT");
    expect(body.zip).toBe("24067");
    expect(body.serviceId).toBe("poste:std");
    expect(body.carrier).toBe("Poste");
    expect(Number(body.merchandise) + Number(body.shipping)).toBeCloseTo(Number(body.total), 2);
    expect(body.merchandise).toBe("45.00");
    expect(body.shipping).toBe("6.50");
    expect(body.total).toBe("51.50");
    expect(mocks.priceOrderLines).toHaveBeenCalledOnce();
  });

  it("returns 500 when pricing throws", async () => {
    mocks.priceOrderLines.mockRejectedValue(new Error("sendcloud down"));
    const res = mockRes();
    await handler(
      postReq({ country: "IT", zip: "24067", lines: [{ id: "tee", size: "M", qty: 1 }] }) as never,
      res as never,
    );
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Could not quote shipping" });
  });
});
