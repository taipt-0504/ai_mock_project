import { describe, expect, it } from "vitest";

import { isSpecialDay } from "@/src/lib/kudos/special-day";

/**
 * TR-004 timezone — Special Day is a calendar day in Asia/Ho_Chi_Minh.
 * `isSpecialDay(date, specialDays)` returns true when the ICT-local date of
 * `date` matches any SpecialDay row's `date` (also stored ICT-aligned at UTC
 * midnight of that day).
 */
describe("isSpecialDay — Asia/Ho_Chi_Minh boundary (TR-004 / FR-010)", () => {
  // Construct UTC instants for "today 2026-05-11 in ICT".
  const todayIctMidnightUtc = new Date("2026-05-11T00:00:00.000Z");
  const specialDays = [{ date: todayIctMidnightUtc }];

  it("returns true at 23:59:59 ICT on the special day (last moment is still today)", () => {
    // 23:59:59 ICT = 16:59:59 UTC.
    const lastMomentToday = new Date("2026-05-11T16:59:59.000Z");
    expect(isSpecialDay(lastMomentToday, specialDays)).toBe(true);
  });

  it("returns false at 00:00:00 ICT on the next day (boundary just rolled over)", () => {
    // 00:00:00 ICT next day = 17:00:00 UTC of 2026-05-11.
    const nextDayStart = new Date("2026-05-11T17:00:00.000Z");
    expect(isSpecialDay(nextDayStart, specialDays)).toBe(false);
  });

  it("returns true at 00:00:00 ICT on the special day (start of day)", () => {
    // 00:00:00 ICT 2026-05-11 = 17:00:00 UTC of 2026-05-10.
    const startOfDay = new Date("2026-05-10T17:00:00.000Z");
    expect(isSpecialDay(startOfDay, specialDays)).toBe(true);
  });

  it("returns false when special days list is empty (no special day configured)", () => {
    const moment = new Date("2026-05-11T08:00:00.000Z");
    expect(isSpecialDay(moment, [])).toBe(false);
  });

  it("matches against ANY row in a multi-special-day list", () => {
    const days = [
      { date: new Date("2026-05-04T00:00:00.000Z") },
      { date: new Date("2026-05-11T00:00:00.000Z") },
    ];
    expect(isSpecialDay(new Date("2026-05-11T03:00:00.000Z"), days)).toBe(true);
    expect(isSpecialDay(new Date("2026-05-04T03:00:00.000Z"), days)).toBe(true);
    expect(isSpecialDay(new Date("2026-05-07T03:00:00.000Z"), days)).toBe(false);
  });
});
