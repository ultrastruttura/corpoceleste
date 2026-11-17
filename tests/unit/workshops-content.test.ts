import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";

const upcomingDir = resolve("content/workshops/upcoming");
const pastDir = resolve("content/workshops/past");

describe("workshops content", () => {
  it("validates upcoming workshop markdown when any exist", () => {
    // Empty upcoming is valid (page shows “nessuna data pubblica”).
    if (!existsSync(upcomingDir)) return;
    const files = readdirSync(upcomingDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const { data } = matter(readFileSync(resolve(upcomingDir, file), "utf8"));
      expect(String(data.when ?? "").trim()).toBeTruthy();
      expect(String(data.where ?? "").trim()).toBeTruthy();
      expect(String(data.organizer ?? "").trim()).toBeTruthy();
      expect(String(data.signupUrl ?? "")).toMatch(/^https?:\/\//);
    }
  });

  it("has past workshop markdown with year + title", () => {
    const files = readdirSync(pastDir).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(50);
    for (const file of files) {
      const { data } = matter(readFileSync(resolve(pastDir, file), "utf8"));
      expect(Number(data.year)).toBeGreaterThan(2000);
      expect(String(data.title ?? "").trim()).toBeTruthy();
    }
  });
});
