import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EventInfo from "@/src/components/home/EventInfo";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("EventInfo (US1 — static event metadata)", () => {
  it("renders the time label + value, location label + value, and Facebook live note from the vi-VN catalog", () => {
    render(<EventInfo locale="vi-VN" />);

    expect(
      screen.getByText(viCatalog["home.event.time.label"], { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.event.time.value"]),
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

  it("renders the same keys from the en-US catalog when locale switches", () => {
    render(<EventInfo locale="en-US" />);

    expect(
      screen.getByText(enCatalog["home.event.time.label"], { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enCatalog["home.event.time.value"]),
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

  it("is purely informational — exposes no interactive elements (no buttons, no links)", () => {
    render(<EventInfo locale="vi-VN" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
