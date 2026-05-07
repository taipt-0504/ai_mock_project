import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NavLinks from "@/src/components/home/NavLinks";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const ABOUT = viCatalog["home.nav.about"];
const AWARDS = viCatalog["home.nav.awards"];
const KUDOS = viCatalog["home.nav.kudos"];

describe("NavLinks (US2 / FR-019 — active-link derivation)", () => {
  it("renders three localized links pointing to '/', '/awards', and '/sun-kudos' in order", () => {
    render(<NavLinks currentPath="/" locale="vi-VN" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/");
    expect(links[0]).toHaveTextContent(ABOUT);
    expect(links[1]).toHaveAttribute("href", "/awards");
    expect(links[1]).toHaveTextContent(AWARDS);
    expect(links[2]).toHaveAttribute("href", "/sun-kudos");
    expect(links[2]).toHaveTextContent(KUDOS);
  });

  it("marks only the link whose href matches currentPath with aria-current='page'", () => {
    render(<NavLinks currentPath="/" locale="vi-VN" />);
    expect(screen.getByRole("link", { name: ABOUT })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: AWARDS })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: KUDOS })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("derives the active marker correctly when currentPath = /awards", () => {
    render(<NavLinks currentPath="/awards" locale="vi-VN" />);
    expect(screen.getByRole("link", { name: AWARDS })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: ABOUT })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders no aria-current at all when currentPath does not match any nav link", () => {
    render(<NavLinks currentPath="/some-orphan-route" locale="vi-VN" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("exposes a Primary nav landmark for screen readers", () => {
    render(<NavLinks currentPath="/" locale="vi-VN" />);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  });
});
