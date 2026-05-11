import { describe, expect, it } from "vitest";

import { slugify } from "@/src/lib/kudos/slugify";

describe("slugify — kebab-case helper for Hashtag slugs", () => {
  it("lowercases and joins words with single hyphens", () => {
    expect(slugify("Dedicated")).toBe("dedicated");
    expect(slugify("Problem Solver")).toBe("problem-solver");
    expect(slugify("Above and Beyond")).toBe("above-and-beyond");
  });

  it("strips Vietnamese diacritics so `IDOL GIỚI TRẺ` → `idol-gioi-tre`", () => {
    expect(slugify("IDOL GIỚI TRẺ")).toBe("idol-gioi-tre");
  });

  it("collapses repeated whitespace and punctuation into a single hyphen", () => {
    expect(slugify("Above   and !! Beyond")).toBe("above-and-beyond");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  Reliable  ")).toBe("reliable");
    expect(slugify("--Innovation--")).toBe("innovation");
  });

  it("returns an empty string for input with no slug-able characters", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
