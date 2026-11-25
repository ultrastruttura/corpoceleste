import { describe, expect, it } from "vitest";
import {
  isParcelHomeDelivery,
  parseShippingOptions,
  pickCheapest,
  selectQuote,
  type ShippingQuote,
} from "../../server/sendcloud/quote-select";

function option(partial: Record<string, unknown>) {
  return {
    code: "carrier:std",
    name: "Standard",
    weight: { min: { value: 0 }, max: { value: 5 } },
    carrier: { name: "Poste" },
    contract: { id: 1 },
    quotes: [{ lead_time: 48, price: { total: { value: 6.5 } } }],
    requirements: {},
    functionalities: {},
    ...partial,
  };
}

describe("isParcelHomeDelivery", () => {
  it("rejects service-point-only options", () => {
    expect(
      isParcelHomeDelivery(
        option({ requirements: { is_service_point_required: true } }),
      ),
    ).toBe(false);
  });

  it("accepts home delivery", () => {
    expect(isParcelHomeDelivery(option({}))).toBe(true);
  });
});

describe("parseShippingOptions + selectQuote", () => {
  it("parses home rates and prefers dropoff when asked (even if more expensive)", () => {
    const data = {
      data: [
        option({
          code: "a:drop",
          functionalities: { first_mile: "dropoff" },
          quotes: [{ lead_time: 48, price: { total: { value: 8 } } }],
        }),
        option({
          code: "b:pick",
          functionalities: { first_mile: "pickup" },
          quotes: [{ lead_time: 48, price: { total: { value: 6.5 } } }],
        }),
        option({
          code: "c:sp",
          requirements: { is_service_point_required: true },
          quotes: [{ lead_time: 24, price: { total: { value: 3 } } }],
        }),
      ],
    };
    const quotes = parseShippingOptions(data, 0.5);
    expect(quotes.map((q) => q.serviceId)).toEqual(["a:drop", "b:pick"]);
    const selected = selectQuote(quotes, true);
    expect(selected?.chosen.serviceId).toBe("a:drop");
    expect(selected?.cheapestPickup?.serviceId).toBe("b:pick");
  });

  it("falls back to pickup only when no dropoff/either exists", () => {
    const quotes = parseShippingOptions(
      {
        data: [
          option({
            code: "b:pick",
            functionalities: { first_mile: "pickup" },
            quotes: [{ lead_time: 48, price: { total: { value: 6.5 } } }],
          }),
        ],
      },
      0.5,
    );
    const selected = selectQuote(quotes, true);
    expect(selected?.chosen.serviceId).toBe("b:pick");
  });

  it("returns null when no options", () => {
    expect(selectQuote([], true)).toBeNull();
  });
});

describe("pickCheapest", () => {
  it("picks lowest price", () => {
    const quotes: ShippingQuote[] = [
      {
        serviceId: "x",
        price: 9,
        currency: "EUR",
        carrier: "A",
        serviceName: "A",
      },
      {
        serviceId: "y",
        price: 5,
        currency: "EUR",
        carrier: "B",
        serviceName: "B",
      },
    ];
    expect(pickCheapest(quotes)?.serviceId).toBe("y");
  });
});
