import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Countdown from "@/src/components/home/Countdown";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const SUBTITLE = viCatalog["home.hero.subtitle"];
const PRELAUNCH_HEADING = viCatalog["prelaunch.heading"];
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

  it("scenario 3: zero-state — eventStart in the past hides the entire Countdown (tiles + subtitle)", () => {
    // FR-008 (revised 2026-05-10): the whole component disappears once the
    // event has started — not just the subtitle. Avoids leaving an awkward
    // 00 / 00 / 00 "ghost" countdown that suggests the event is still
    // pending. Hero composition keeps EventInfo on the page; the countdown
    // block alone is what unmounts.
    const eventStart = new Date("2020-01-01T00:00:00.000Z"); // far in the past

    const { container } = render(
      <Countdown eventStart={eventStart} locale="vi-VN" />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(DAYS)).not.toBeInTheDocument();
    expect(screen.queryByText(HOURS)).not.toBeInTheDocument();
    expect(screen.queryByText(MINUTES)).not.toBeInTheDocument();
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

describe("Countdown — subtitleAs / subtitleKey props (Prelaunch FR-010, Q-CP5)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-30T18:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults preserve Homepage rendering — <p> with home.hero.subtitle", () => {
    const eventStart = new Date("2025-12-31T20:35:00.000Z");
    render(<Countdown eventStart={eventStart} locale="vi-VN" />);

    const subtitle = screen.getByText(SUBTITLE);
    expect(subtitle.tagName).toBe("P");
    // Should NOT be findable as a heading at any level.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("subtitleAs='h1' + subtitleKey='prelaunch.heading' renders an <h1> with the prelaunch text", () => {
    const eventStart = new Date("2025-12-31T20:35:00.000Z");
    render(
      <Countdown
        eventStart={eventStart}
        locale="vi-VN"
        subtitleAs="h1"
        subtitleKey="prelaunch.heading"
      />,
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: PRELAUNCH_HEADING,
    });
    expect(heading).toBeInTheDocument();
    // The default home.hero.subtitle MUST NOT appear when overridden.
    expect(screen.queryByText(SUBTITLE)).not.toBeInTheDocument();
  });

  it("explicit subtitleKey with default subtitleAs='p' renders <p> with the overridden text", () => {
    const eventStart = new Date("2025-12-31T20:35:00.000Z");
    render(
      <Countdown
        eventStart={eventStart}
        locale="vi-VN"
        subtitleKey="prelaunch.heading"
      />,
    );

    const overridden = screen.getByText(PRELAUNCH_HEADING);
    expect(overridden.tagName).toBe("P");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("subtitleAs='h1' — entire component is hidden when eventStart is in the past (FR-008 revised)", () => {
    const eventStart = new Date("2020-01-01T00:00:00.000Z");
    const { container } = render(
      <Countdown
        eventStart={eventStart}
        locale="vi-VN"
        subtitleAs="h1"
        subtitleKey="prelaunch.heading"
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.queryByText(PRELAUNCH_HEADING)).not.toBeInTheDocument();
  });
});
