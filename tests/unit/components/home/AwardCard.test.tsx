import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AwardCard from "@/src/components/home/AwardCard";
import { AWARDS } from "@/src/lib/awards/awards";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const TOP_TALENT = AWARDS.find((a) => a.slug === "top-talent")!;
const MVP = AWARDS.find((a) => a.slug === "mvp")!;

describe("AwardCard (FR-011 / FR-012 / FR-013)", () => {
  it("wraps the entire card in a single Link to /awards#<slug> — title and 'Chi tiết' share the same anchor (no nested <a>)", () => {
    const { container } = render(
      <AwardCard award={TOP_TALENT} locale="vi-VN" />,
    );
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/awards#top-talent");

    const heading = screen.getByRole("heading", {
      name: viCatalog["home.awards.top_talent.title"],
    });
    const detailLabel = screen.getByText(
      viCatalog["home.awards.section.detail_button"],
    );
    expect(links[0]).toContainElement(heading);
    expect(links[0]).toContainElement(detailLabel);
  });

  it("each canonical slug yields the corresponding /awards# anchor", () => {
    for (const award of AWARDS) {
      const { container, unmount } = render(
        <AwardCard award={award} locale="vi-VN" />,
      );
      const link = container.querySelector("a");
      expect(link).toHaveAttribute("href", `/awards#${award.slug}`);
      unmount();
    }
  });

  it("description has the line-clamp-2 utility (FR-013 — visual ellipsis after two lines)", () => {
    render(<AwardCard award={TOP_TALENT} locale="vi-VN" />);
    const desc = screen.getByText(
      viCatalog["home.awards.top_talent.description"],
    );
    expect(desc.className).toContain("line-clamp-2");
  });

  it("title and description are localized through the i18n key on Award", () => {
    render(<AwardCard award={MVP} locale="vi-VN" />);
    expect(
      screen.getByText(viCatalog["home.awards.mvp.title"]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.awards.mvp.description"]),
    ).toBeInTheDocument();
  });

  it("renders the slug-derived label asset with the localized title as alt text (the bg art is decorative)", () => {
    render(<AwardCard award={TOP_TALENT} locale="vi-VN" />);
    const labelImage = screen.getByAltText(
      viCatalog["home.awards.top_talent.title"],
    );
    expect(labelImage.getAttribute("src")).toContain(
      "award-top-talent",
    );
  });
});
