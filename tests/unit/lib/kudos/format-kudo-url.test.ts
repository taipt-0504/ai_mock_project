import { afterEach, describe, expect, it, vi } from "vitest";

import { formatKudoUrl } from "@/src/lib/kudos/format-kudo-url";

describe("formatKudoUrl — Kudos share URL (FR-011)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns an absolute URL when NEXT_PUBLIC_BASE_URL is set (Copy Link → clipboard)", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://saa.example.com");
    expect(formatKudoUrl("seed-kudo-7")).toBe(
      "https://saa.example.com/sun-kudos/seed-kudo-7",
    );
  });

  it("strips a trailing slash from the base URL to avoid double-slash in the path", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://saa.example.com/");
    expect(formatKudoUrl("seed-kudo-0")).toBe(
      "https://saa.example.com/sun-kudos/seed-kudo-0",
    );
  });

  it("falls back to a root-relative path when NEXT_PUBLIC_BASE_URL is missing (dev / preview)", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    expect(formatKudoUrl("seed-kudo-3")).toBe("/sun-kudos/seed-kudo-3");
  });

  it("rejects empty id (programming error — caller must pass a real Kudo id)", () => {
    expect(() => formatKudoUrl("")).toThrowError();
  });
});
