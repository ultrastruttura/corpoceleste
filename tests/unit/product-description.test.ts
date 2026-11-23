import { describe, expect, it } from "vitest";
import { productDescriptionHtml } from "../../src/lib/product-description";

describe("productDescriptionHtml", () => {
  it("turns single newlines into <br> and blank lines into paragraphs", () => {
    const html = productDescriptionHtml("Linea uno\nLinea due\n\nSecondo paragrafo");
    expect(html).toBe("<p>Linea uno<br />Linea due</p><p>Secondo paragrafo</p>");
  });

  it("supports bold, italic, and https links", () => {
    const html = productDescriptionHtml("**grassetto** e *corsivo* e [sito](https://example.com)");
    expect(html).toBe(
      '<p><strong>grassetto</strong> e <em>corsivo</em> e <a href="https://example.com" rel="noopener noreferrer">sito</a></p>',
    );
  });

  it("escapes raw HTML", () => {
    const html = productDescriptionHtml('<script>alert(1)</script>');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
