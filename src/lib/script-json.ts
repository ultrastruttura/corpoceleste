/** Serialize JSON for the raw text inside an HTML script element. */
export function scriptJson(value: unknown): string {
  // The HTML parser recognizes </script> even inside a JSON string.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
