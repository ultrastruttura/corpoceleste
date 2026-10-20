import { readFileSync } from "node:fs";

/** Mirror of server/stock-patch.ts for a quick sanity check without a TS runner. */
function stockQtyLineRe(size) {
  const sizeEsc = size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^([ \\t]+)((?:"${sizeEsc}"|'${sizeEsc}'|${sizeEsc}):\\s*)(\\d+)\\s*$`,
    "m",
  );
}

function patchStockQty(markdown, size, nextQty) {
  const qty = Math.max(0, Math.floor(nextQty));
  const source = markdown.replace(/^\uFEFF/, "");
  const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const front = fm[1];
  const stockMatch = front.match(
    /(^|\r?\n)(stock:\r?\n)((?:[ \t]+[^\r\n]*\r?\n)*(?:[ \t]+[^\r\n]*)?)/,
  );
  if (!stockMatch) return null;
  const stockBody = stockMatch[3];
  const lineRe = stockQtyLineRe(size);
  const lineMatch = stockBody.match(lineRe);
  if (!lineMatch) return null;
  const before = Math.floor(Number(lineMatch[3]));
  if (!Number.isFinite(before)) return null;
  if (before === qty) return { content: markdown, before };
  const newStockBody = stockBody.replace(lineRe, `$1$2${qty}`);
  const newFront = front.replace(stockMatch[0], `${stockMatch[1]}${stockMatch[2]}${newStockBody}`);
  const patchedFm = `---\n${newFront}\n---`;
  const bom = markdown.startsWith("\uFEFF") ? "\uFEFF" : "";
  const content = bom + source.replace(fm[0], patchedFm);
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

const quoted = `---
title: Print
stock:
  "50x70": 8
  'unico': 2
---
`;
const q = patchStockQty(quoted, "50x70", 7);
if (!q || q.before !== 8 || !q.content.includes('"50x70": 7')) {
  console.error("quoted size patch failed", q);
  process.exit(1);
}
const q2 = patchStockQty(quoted, "unico", 1);
if (!q2 || q2.before !== 2 || !q2.content.includes("'unico': 1")) {
  console.error("single-quoted size patch failed", q2);
  process.exit(1);
}

const bomSample = "\uFEFF" + quoted.replace(/\n/g, "\r\n");
const qb = patchStockQty(bomSample, "50x70", 6);
if (!qb || qb.before !== 8 || !/"50x70":\s*6/.test(qb.content) || !qb.content.startsWith("\uFEFF")) {
  console.error("BOM+CRLF quoted patch failed", qb && JSON.stringify(qb.content.slice(0, 80)));
  process.exit(1);
}

const real = readFileSync("content/products/anubi.md", "utf8");
const r = patchStockQty(real, "S", 4);
if (!r || !r.content.includes("  S: 4") || !r.content.includes("Maglia 1")) {
  console.error("anubi patch failed", r);
  process.exit(1);
}

const print = readFileSync("content/products/once.md", "utf8");
const pr = patchStockQty(print, "50x70", 7);
if (!pr || pr.before !== 8 || !/"50x70":\s*7/.test(pr.content)) {
  console.error("once.md quoted stock patch failed", pr);
  process.exit(1);
}

const pana = readFileSync("content/products/pana.md", "utf8");
const pa = patchStockQty(pana, "unico", 4);
if (!pa || pa.before !== 5 || !/"unico":\s*4/.test(pa.content)) {
  console.error("pana.md quoted stock patch failed", pa);
  process.exit(1);
}

console.log("stock-patch ok");
