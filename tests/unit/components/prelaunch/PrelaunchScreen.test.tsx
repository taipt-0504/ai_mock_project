import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PrelaunchScreen from "@/src/components/prelaunch/PrelaunchScreen";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const PRELAUNCH_HEADING = viCatalog["prelaunch.heading"];
const DAYS = viCatalog["home.hero.countdown.days"];
const HOURS = viCatalog["home.hero.countdown.hours"];
const MINUTES = viCatalog["home.hero.countdown.minutes"];

describe("PrelaunchScreen (Prelaunch FR-001 / FR-003 / US4)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders exactly one <main> landmark", () => {
    const future = new Date("2026-06-01T09:00:00.000Z");
    const { container } = render(<PrelaunchScreen launchAt={future} locale="vi-VN" />);

    const mains = container.querySelectorAll("main");
    expect(mains).toHaveLength(1);
  });

  it("renders the prelaunch heading as <h1> via the i18n key", () => {
    const future = new Date("2026-06-01T09:00:00.000Z");
    render(<PrelaunchScreen launchAt={future} locale="vi-VN" />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: PRELAUNCH_HEADING,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders DAYS / HOURS / MINUTES tile labels", () => {
    const future = new Date("2026-06-01T09:00:00.000Z");
    render(<PrelaunchScreen launchAt={future} locale="vi-VN" />);

    expect(screen.getByText(DAYS)).toBeInTheDocument();
    expect(screen.getByText(HOURS)).toBeInTheDocument();
    expect(screen.getByText(MINUTES)).toBeInTheDocument();
  });

  it("does NOT render any <button> or <a> elements (FR-003 / US4 invariant)", () => {
    const future = new Date("2026-06-01T09:00:00.000Z");
    const { container } = render(<PrelaunchScreen launchAt={future} locale="vi-VN" />);

    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("does NOT render a <header>, <footer>, or <nav> landmark", () => {
    const future = new Date("2026-06-01T09:00:00.000Z");
    const { container } = render(<PrelaunchScreen launchAt={future} locale="vi-VN" />);

    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
    expect(container.querySelector("nav")).toBeNull();
  });

  it("renders --/--/-- placeholders when launchAt is null (FR-009 fail-closed)", () => {
    const { container } = render(<PrelaunchScreen launchAt={null} locale="vi-VN" />);

    // Three placeholder digit groups. The exact label-prev-sibling pattern is
    // tested in Countdown.test.tsx; here we just confirm the placeholder shows up.
    expect(container.textContent).toContain("--");
    // Heading still present (FR-009: null env shows the screen with placeholders).
    expect(
      screen.getByRole("heading", { level: 1, name: PRELAUNCH_HEADING }),
    ).toBeInTheDocument();
  });
});
