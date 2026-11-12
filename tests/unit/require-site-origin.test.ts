import { afterEach, describe, expect, it, vi } from "vitest";
import { requireSiteOrigin } from "../../server/portal/http";

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(k: string, v: string) {
      this.headers[k] = v;
      return this;
    },
    send(body: unknown) {
      this.body = body;
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

describe("requireSiteOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows JSON POST from the shop origin with Sec-Fetch cors", () => {
    vi.stubEnv("SITE_URL", "https://www.corpoceleste.eu");
    vi.stubEnv("VERCEL_ENV", "production");
    const req = {
      headers: {
        origin: "https://www.corpoceleste.eu",
        "content-type": "application/json",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
      },
    };
    const res = mockRes();
    expect(requireSiteOrigin(req as never, res as never)).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it("rejects missing Origin on JSON POST", () => {
    vi.stubEnv("SITE_URL", "https://www.corpoceleste.eu");
    vi.stubEnv("VERCEL_ENV", "production");
    const req = {
      headers: {
        "content-type": "application/json",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "cors",
      },
    };
    const res = mockRes();
    expect(requireSiteOrigin(req as never, res as never)).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("rejects production requests without Sec-Fetch-Site", () => {
    vi.stubEnv("SITE_URL", "https://www.corpoceleste.eu");
    vi.stubEnv("VERCEL_ENV", "production");
    const req = {
      headers: {
        origin: "https://www.corpoceleste.eu",
        "content-type": "application/json",
      },
    };
    const res = mockRes();
    expect(requireSiteOrigin(req as never, res as never)).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});
