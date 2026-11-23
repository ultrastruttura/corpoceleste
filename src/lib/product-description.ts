/** Plain-text product descriptions from Tina (textarea) → safe HTML paragraphs. */

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal inline markdown after HTML escape: links, bold, italic. */
function inlineMarkdown(escaped: string) {
  return escaped
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/**
 * Tina textarea: Enter = line break, blank line = new paragraph.
 * Optional markdown: **bold**, *italic*, [label](https://…).
 */
export function productDescriptionHtml(raw: string): string {
  const text = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  return text
    .split(/\n\n+/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const lines = para.split("\n").map((line) => inlineMarkdown(escapeHtml(line)));
      return `<p>${lines.join("<br />")}</p>`;
    })
    .join("");
}
