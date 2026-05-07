import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import KudosBlock from "@/src/components/home/KudosBlock";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("KudosBlock (US5 — promo block)", () => {
  it("renders the localized label, title, description, illustration, and a 'Chi tiết' link to /sun-kudos", () => {
    render(<KudosBlock locale="vi-VN" />);

    expect(screen.getByText(viCatalog["home.kudos.label"])).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: viCatalog["home.kudos.title"] }),
    ).toBeInTheDocument();
    // Description contains a newline; use a partial match so testing-library's
    // whitespace normalization doesn't collide with the literal `\n`.
    expect(screen.getByText(/ĐIỂM MỚI CỦA SAA 2025/i)).toBeInTheDocument();

    // Illustration uses the localized title as alt — i.e. the Sun* Kudos
    // wordmark is a meaningful image, not decorative.
    expect(screen.getByAltText(viCatalog["home.kudos.title"])).toBeInTheDocument();

    const detailLink = screen.getByRole("link", {
      name: new RegExp(viCatalog["home.kudos.detail_button"], "i"),
    });
    expect(detailLink).toHaveAttribute("href", "/sun-kudos");
  });

  it("re-renders the same structure with English copy when the locale switches", () => {
    render(<KudosBlock locale="en-US" />);

    expect(screen.getByText(enCatalog["home.kudos.label"])).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: enCatalog["home.kudos.title"] }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: new RegExp(enCatalog["home.kudos.detail_button"], "i"),
      }),
    ).toHaveAttribute("href", "/sun-kudos");
  });
});
