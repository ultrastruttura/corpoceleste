import { readFileSync } from "node:fs";

/** Mirror of server/stock-patch.ts for a quick sanity check without a TS runner. */
function patchStockQty(markdown, size, nextQty) {
  const qty = Math.max(0, Math.floor(nextQty));
  const sizeRe = size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const front = fm[1];
  const stockMatch = front.match(/(^|\n)(stock:\r?\n)((?:[ \t]+[^\r\n]*\r?\n)*)/);
  if (!stockMatch) return null;
  const stockBody = stockMatch[3];
  const lineRe = new RegExp(`^([ \\t]+${sizeRe}:\\s*)(\\d+)\\s*$`, "m");
  const lineMatch = stockBody.match(lineRe);
  if (!lineMatch) return null;
  const before = Math.floor(Number(lineMatch[2]));
  if (!Number.isFinite(before)) return null;
  if (before === qty) return { content: markdown, before };
  const newStockBody = stockBody.replace(lineRe, `$1${qty}`);
  const newFront = front.replace(stockMatch[0], `${stockMatch[1]}${stockMatch[2]}${newStockBody}`);
  const content = markdown.replace(fm[0], `---\n${newFront}\n---`);
  return { content, before };
}

const sample = `---
title: Test
stock:
  S: 5
  M: 3
  L: 0
  XL: 2
---
body
`;

const p = patchStockQty(sample, "M", 1);
if (!p || p.before !== 3 || !p.content.includes("  M: 1")) {
  console.error("patch failed", p);
  process.exit(1);
}
if (!p.content.includes("title: Test") || !p.content.includes("body")) {
  console.error("spoiled frontmatter");
  process.exit(1);
}
const real = readFileSync("content/products/anubi.md", "utf8");
const r = patchStockQty(real, "S", 4);
if (!r || !r.content.includes("  S: 4") || !r.content.includes("Angelini")) {
  console.error("anubi patch failed");
  process.exit(1);
}
console.log("stock-patch ok");
