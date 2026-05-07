import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Countdown from "@/src/components/home/Countdown";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const SUBTITLE = viCatalog["home.hero.subtitle"];
const DAYS = viCatalog["home.hero.countdown.days"];
const HOURS = viCatalog["home.hero.countdown.hours"];
const MINUTES = viCatalog["home.hero.countdown.minutes"];

function tilesFromDom(): { days: string; hours: string; minutes: string } {
  // Each tile is `<div>{value}</div><span>{label}</span>` inside a wrapper —
  // so the label's `previousElementSibling` is the value tile.
  const valueOf = (label: string): string => {
    const labelEl = screen.getByText(label);
    return labelEl.previousElementSibling?.textContent?.trim() ?? "";
  };
  return {
    days: valueOf(DAYS),
    hours: valueOf(HOURS),
    minutes: valueOf(MINUTES),
  };
}

describe("Countdown (US1)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-30T18:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("scenario 1: future eventStart — renders ticking values with 2-digit padding and shows the 'Coming soon' subtitle", () => {
    // 1 day + 2 hours + 5 minutes ahead → "01" / "02" / "05" with leading zeros.
    const eventStart = new Date("2025-12-31T20:35:00.000Z");

    render(<Countdown eventStart={eventStart} locale="vi-VN" />);

    expect(screen.getByText(SUBTITLE)).toBeInTheDocument();
    const tiles = tilesFromDom();
    expect(tiles.days).toBe("01");
    expect(tiles.hours).toBe("02");
    expect(tiles.minutes).toBe("05");
  });

  it("scenario 2: per-minute decrement — advancing the clock by one minute drops the minutes tile by 1", () => {
    const eventStart = new Date("2025-12-31T20:35:00.000Z");
    render(<Countdown eventStart={eventStart} locale="vi-VN" />);

    expect(tilesFromDom().minutes).toBe("05");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(tilesFromDom().minutes).toBe("04");
  });

  it("scenario 3: zero-state — eventStart in the past renders 00 / 00 / 00 and hides the subtitle", () => {
    const eventStart = new Date("2020-01-01T00:00:00.000Z"); // far in the past

    render(<Countdown eventStart={eventStart} locale="vi-VN" />);

    expect(screen.queryByText(SUBTITLE)).not.toBeInTheDocument();
    const tiles = tilesFromDom();
    expect(tiles.days).toBe("00");
    expect(tiles.hours).toBe("00");
    expect(tiles.minutes).toBe("00");
  });

  it("scenario 4: null eventStart — renders -- / -- / -- fallback (still shows the subtitle)", () => {
    render(<Countdown eventStart={null} locale="vi-VN" />);

    expect(screen.getByText(SUBTITLE)).toBeInTheDocument();
    const tiles = tilesFromDom();
    expect(tiles.days).toBe("--");
    expect(tiles.hours).toBe("--");
    expect(tiles.minutes).toBe("--");
  });

  it("scenario 5: visibilitychange recovery — returning from an inactive tab recomputes against the current clock", () => {
    const eventStart = new Date("2025-12-31T20:35:00.000Z");
    render(<Countdown eventStart={eventStart} locale="vi-VN" />);

    expect(tilesFromDom().minutes).toBe("05");

    // Simulate the tab being hidden for 10 minutes WITHOUT firing the
    // setInterval tick (browsers throttle / suspend background timers).
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    act(() => {
      vi.setSystemTime(new Date("2025-12-30T18:40:00.000Z"));
    });

    // Tab returns — values must jump to current via the visibilitychange
    // handler, not via the (suspended) interval.
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // 10 minutes of real-clock advance → minutes tile drops 5 → 55? Let's
    // recompute: eventStart - now = 25h 55m → days 1, hours 1, minutes 55.
    const tiles = tilesFromDom();
    expect(tiles.days).toBe("01");
    expect(tiles.hours).toBe("01");
    expect(tiles.minutes).toBe("55");
  });
});
