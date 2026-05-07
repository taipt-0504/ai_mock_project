import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Footer from "@/src/components/home/Footer";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("Footer (US6 / FR-016 — footer links + copyright)", () => {
  it("renders all four nav links with their canonical hrefs (incl. /general-rules for the 7.5 link)", () => {
    render(<Footer currentPath="/" locale="vi-VN" />);

    const footerNav = screen.getByRole("navigation", { name: /footer/i });
    const links = within(footerNav).getAllByRole("link");
    expect(links).toHaveLength(4);

    const expected: ReadonlyArray<[href: string, label: string]> = [
      ["/", viCatalog["home.footer.about"]],
      ["/awards", viCatalog["home.footer.awards"]],
      ["/sun-kudos", viCatalog["home.footer.kudos"]],
      ["/general-rules", viCatalog["home.footer.general_rules"]],
    ];
    expected.forEach(([href, label], idx) => {
      expect(links[idx]).toHaveAttribute("href", href);
      expect(links[idx]).toHaveTextContent(label);
    });
  });

  it("renders the localized copyright string", () => {
    render(<Footer currentPath="/" locale="vi-VN" />);
    expect(
      screen.getByText(viCatalog["footer.copyright"]),
    ).toBeInTheDocument();
  });

  it("active-link derivation mirrors the header — the link whose href matches currentPath gets aria-current='page'", () => {
    render(<Footer currentPath="/awards" locale="vi-VN" />);
    expect(
      screen.getByRole("link", { name: viCatalog["home.footer.awards"] }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: viCatalog["home.footer.about"] }),
    ).not.toHaveAttribute("aria-current");
  });

  it("renders the brand logo with a meaningful alt text (Sun Annual Awards)", () => {
    render(<Footer currentPath="/" locale="vi-VN" />);
    expect(
      screen.getByAltText(/sun annual awards/i),
    ).toBeInTheDocument();
  });

  it("locale switch flips all four labels to English", () => {
    render(<Footer currentPath="/" locale="en-US" />);
    const footerNav = screen.getByRole("navigation", { name: /footer/i });
    const labels = within(footerNav)
      .getAllByRole("link")
      .map((a) => a.textContent?.trim());
    expect(labels).toEqual([
      enCatalog["home.footer.about"],
      enCatalog["home.footer.awards"],
      enCatalog["home.footer.kudos"],
      enCatalog["home.footer.general_rules"],
    ]);
  });
});
