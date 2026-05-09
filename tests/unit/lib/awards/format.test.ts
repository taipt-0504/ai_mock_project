import { describe, expect, it } from "vitest";

import { formatVndAmount } from "@/src/lib/awards/format";

describe("formatVndAmount", () => {
  it("formats 7_000_000 with Vietnamese thousand-separator '.'", () => {
    expect(formatVndAmount(7_000_000)).toBe("7.000.000");
  });

  it("formats 15_000_000 with Vietnamese thousand-separator '.'", () => {
    expect(formatVndAmount(15_000_000)).toBe("15.000.000");
  });

  it("formats 0 as '0'", () => {
    expect(formatVndAmount(0)).toBe("0");
  });

  it("never emits ',' as separator (sanity guard against system-locale leakage)", () => {
    expect(formatVndAmount(1_234_567)).not.toContain(",");
  });
});
