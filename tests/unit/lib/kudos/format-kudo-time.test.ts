import { describe, expect, it } from "vitest";

import { formatKudoTime } from "@/src/lib/kudos/format-kudo-time";

describe("formatKudoTime — Figma C.3.4 timestamp renderer", () => {
  it("renders the Figma sample `10:00 - 10/30/2025` for an early-morning Oct 30 2025 date", () => {
    const sample = new Date(2025, 9, 30, 10, 0, 0);
    expect(formatKudoTime(sample)).toBe("10:00 - 10/30/2025");
  });

  it("zero-pads hours, minutes, month, and day", () => {
    const sample = new Date(2025, 0, 3, 9, 5, 0);
    expect(formatKudoTime(sample)).toBe("09:05 - 01/03/2025");
  });

  it("accepts an ISO string", () => {
    expect(formatKudoTime("2025-10-30T03:00:00.000Z")).toMatch(
      /^\d{2}:\d{2} - 10\/30\/2025$/,
    );
  });

  it("returns empty string for invalid date input", () => {
    expect(formatKudoTime("not-a-date")).toBe("");
  });
});
