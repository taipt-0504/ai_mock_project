import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CTAButtons from "@/src/components/home/CTAButtons";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("CTAButtons (FR-010)", () => {
  it("renders two anchor buttons whose hrefs point at the canonical destinations (/awards, /sun-kudos)", () => {
    render(<CTAButtons locale="vi-VN" />);

    const aboutAwards = screen.getByRole("link", {
      name: new RegExp(viCatalog["home.cta.about_awards"], "i"),
    });
    const aboutKudos = screen.getByRole("link", {
      name: new RegExp(viCatalog["home.cta.about_kudos"], "i"),
    });
    expect(aboutAwards).toHaveAttribute("href", "/awards");
    expect(aboutKudos).toHaveAttribute("href", "/sun-kudos");
  });

  it("uses motion-safe hover utilities so the animations respect prefers-reduced-motion", () => {
    render(<CTAButtons locale="vi-VN" />);
    const aboutAwards = screen.getByRole("link", {
      name: new RegExp(viCatalog["home.cta.about_awards"], "i"),
    });
    const aboutKudos = screen.getByRole("link", {
      name: new RegExp(viCatalog["home.cta.about_kudos"], "i"),
    });
    expect(aboutAwards.className).toContain("motion-safe:");
    expect(aboutKudos.className).toContain("motion-safe:");
  });

  it("re-renders with English labels when locale flips", () => {
    render(<CTAButtons locale="en-US" />);
    expect(
      screen.getByRole("link", {
        name: new RegExp(enCatalog["home.cta.about_awards"], "i"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: new RegExp(enCatalog["home.cta.about_kudos"], "i"),
      }),
    ).toBeInTheDocument();
  });
});
