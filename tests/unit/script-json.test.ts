import { describe, expect, it } from "vitest";
import { scriptJson } from "../../src/lib/script-json";

describe("JSON embedded in script elements", () => {
  it("keeps CMS text intact without emitting an HTML closing tag", () => {
    const value = {
      title: '</ScRiPt><script src="/injected.js"></script>',
      description: "Serigrafia <artigianale> & edizioni",
    };
    const serialized = scriptJson(value);

    expect(serialized).not.toMatch(/<\/script/i);
    expect(serialized).not.toContain("<script");
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
