import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EventInfo from "@/src/components/home/EventInfo";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

// Default env example (.env.example): SAA_EVENT_START_AT="2025-12-31T18:30:00+07:00".
// In ICT (UTC+7) that's December 31, 2025 at 18:30; the formatter must read
// the env-defined Date as-is rather than rebasing to the test runner's TZ.
const EVENT_START = new Date("2025-12-31T18:30:00+07:00");

describe("EventInfo (US1 — event metadata)", () => {
  it("renders all labels + the location value + the Facebook live note from the vi-VN catalog", () => {
    render(<EventInfo locale="vi-VN" eventStart={EVENT_START} />);

    expect(
      screen.getByText(viCatalog["home.event.time.label"], { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.event.location.label"], { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.event.location.value"]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.event.facebook"]),
    ).toBeInTheDocument();
  });

  it("renders the same labels from the en-US catalog when locale switches", () => {
    render(<EventInfo locale="en-US" eventStart={EVENT_START} />);

    expect(
      screen.getByText(enCatalog["home.event.time.label"], { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enCatalog["home.event.location.label"], { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enCatalog["home.event.location.value"]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enCatalog["home.event.facebook"]),
    ).toBeInTheDocument();
  });

  it("derives the time value from the eventStart prop, formatted DD/MM/YYYY for vi-VN", () => {
    // Spec FR-009 (revised 2026-05-10): time value derives from
    // SAA_EVENT_START_AT, not a hardcoded i18n string. vi-VN uses
    // numeric DD/MM/YYYY so it lines up with countdown's `Days` / `Hours`.
    render(<EventInfo locale="vi-VN" eventStart={EVENT_START} />);

    expect(screen.getByText("31/12/2025")).toBeInTheDocument();
  });

  it("derives the time value from the eventStart prop, formatted 'Month D, YYYY' for en-US", () => {
    render(<EventInfo locale="en-US" eventStart={EVENT_START} />);

    expect(screen.getByText("December 31, 2025")).toBeInTheDocument();
  });

  it("falls back to the i18n catalog string when eventStart is null", () => {
    render(<EventInfo locale="vi-VN" eventStart={null} />);

    expect(
      screen.getByText(viCatalog["home.event.time.value"]),
    ).toBeInTheDocument();
  });

  it("is purely informational — exposes no interactive elements (no buttons, no links)", () => {
    render(<EventInfo locale="vi-VN" eventStart={EVENT_START} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
