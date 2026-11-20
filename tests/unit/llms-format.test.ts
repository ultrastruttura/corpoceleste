import { describe, expect, it } from "vitest";
import {
  clipText,
  formatProductBlurb,
  formatProductFacts,
  productBodyForAgents,
  stripMarkdownLinks,
} from "../../src/lib/llms-format";

describe("llms-format", () => {
  it("strips markdown links and handmade disclaimer blocks", () => {
    expect(stripMarkdownLinks("see [CORPOC](https://x.test/) here")).toBe("see CORPOC here");
    const body = productBodyForAgents(
      "Maglia 50 pezzi\n\nUN PAIO DI COSE DA TENERE IN CONSIDERAZIONE:\nvariazioni…",
    );
    expect(body).toBe("Maglia 50 pezzi");
    expect(body).not.toMatch(/variazioni/);
  });

  it("builds fact lines and prefers seo blurb", () => {
    const facts = formatProductFacts({
      kindLabel: "maglia",
      colorLabel: "colore",
      compositionLabel: "composizione",
      sizesLabel: "taglie",
      colorName: "Nero",
      composition: "100% cotone",
      hasSizes: true,
      sizes: ["S", "M", "L"],
      artist: "Totemica",
      title: '"Zain" t-shirt',
      price: 40,
      statusLabel: "preordine",
    });
    expect(facts).toContain("maglia");
    expect(facts).toContain("Totemica");
    expect(facts).toContain("40 €");
    expect(facts).toContain("taglie S–M–L");

    expect(
      formatProductBlurb({
        seo: "Hand screen-printed Zain tee.",
        description: "",
        facts,
      }),
    ).toBe("Hand screen-printed Zain tee");

    expect(
      formatProductBlurb({
        seo: "",
        description: "",
        facts,
      }),
    ).toBe(facts);
  });

  it("clips long text with ellipsis", () => {
    expect(clipText("abc", 10)).toBe("abc");
    expect(clipText("abcdefghijklmnop", 8)).toMatch(/…$/);
  });
});
