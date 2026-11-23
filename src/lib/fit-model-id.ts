/** Tina reference `content/fit-models/tee-default.md` → `tee-default`. */
export function fitModelIdFromRef(ref: unknown): string {
  const s = String(ref ?? "").trim();
  if (!s) return "";
  const match = s.match(/fit-models\/([^/]+?)(?:\.md)?$/);
  return match?.[1] ?? s.replace(/\.md$/, "");
}
