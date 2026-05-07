import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RootFurtherEssay from "@/src/components/home/RootFurtherEssay";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("RootFurtherEssay (US9 — three-paragraph theme essay + pull-quote)", () => {
  it("renders all three paragraphs and the pull-quote from the vi-VN catalog", () => {
    render(<RootFurtherEssay locale="vi-VN" />);
    expect(
      screen.getByText(viCatalog["home.essay.paragraph1"]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.essay.paragraph2"]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.essay.paragraph3"]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["home.essay.quote"]),
    ).toBeInTheDocument();
  });

  it("renders the pull-quote inside a <blockquote> element so it is semantically distinct", () => {
    const { container } = render(<RootFurtherEssay locale="vi-VN" />);
    const blockquote = container.querySelector("blockquote");
    expect(blockquote).not.toBeNull();
    expect(blockquote).toHaveTextContent(viCatalog["home.essay.quote"]);
  });

  it("is purely informational — no interactive elements (no buttons, no links)", () => {
    render(<RootFurtherEssay locale="vi-VN" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("re-renders identical structure with English copy when locale switches", () => {
    render(<RootFurtherEssay locale="en-US" />);
    expect(
      screen.getByText(enCatalog["home.essay.paragraph1"]),
    ).toBeInTheDocument();
    expect(
      screen.getByText(enCatalog["home.essay.quote"]),
    ).toBeInTheDocument();
  });
});
