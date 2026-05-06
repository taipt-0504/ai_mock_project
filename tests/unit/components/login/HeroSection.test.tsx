import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/components/login/LoginButton", () => ({
  default: ({ labels }: { labels: { label: string } }) => (
    <button data-testid="login-button-stub" type="button">
      {labels.label}
    </button>
  ),
}));

import HeroSection from "@/src/components/login/HeroSection";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";

describe("HeroSection (B.1 + B.2 + B.3)", () => {
  it("renders the program title image with the localized title as alt text (vi-VN)", () => {
    render(<HeroSection locale="vi-VN" />);
    const titleImage = screen.getByAltText(viCatalog["program.title"]);
    expect(titleImage).toBeInTheDocument();
    expect(titleImage.tagName).toBe("IMG");
  });

  it("renders both description lines from the active catalog (vi-VN)", () => {
    const { container } = render(<HeroSection locale="vi-VN" />);
    const description = container.querySelector("p");
    expect(description).not.toBeNull();
    expect(description!.textContent).toContain(viCatalog["program.description1"]);
    expect(description!.textContent).toContain(viCatalog["program.description2"]);
  });

  it("renders the description lines from the en-US catalog when locale is en-US", () => {
    const { container } = render(<HeroSection locale="en-US" />);
    const description = container.querySelector("p");
    expect(description).not.toBeNull();
    expect(description!.textContent).toContain(enCatalog["program.description1"]);
    expect(description!.textContent).toContain(enCatalog["program.description2"]);
  });

  it("forwards the localized loginButton.label to the LoginButton child", () => {
    render(<HeroSection locale="vi-VN" />);
    const stubButton = screen.getByTestId("login-button-stub");
    expect(stubButton).toHaveTextContent(viCatalog["loginButton.label"]);
  });

  it("does NOT render any heading or anchor element for the description copy (FR-014 — read-only)", () => {
    render(<HeroSection locale="vi-VN" />);
    // The hero copy is intentionally not a heading and is not interactive —
    // hovering / clicking yields no state change (US4 acceptance).
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("exposes the B.1 key visual + LoginButton's Google G icon as decorative to assistive tech (T068)", () => {
    const { container } = render(<HeroSection locale="vi-VN" />);
    // Every <img> inside HeroSection that is NOT the program title MUST be
    // exposed as decorative (alt="" or aria-hidden="true") so screen readers
    // don't read the file name. The title image is the only meaningful one.
    const images = container.querySelectorAll("img");
    const decorativeCount = Array.from(images).filter(
      (img) => img.getAttribute("alt") === "" || img.getAttribute("aria-hidden") === "true",
    ).length;
    const meaningful = Array.from(images).filter(
      (img) => img.getAttribute("alt") && img.getAttribute("alt") !== "",
    );
    // The program title image is the only meaningful one in this section.
    expect(meaningful).toHaveLength(1);
    expect(decorativeCount + meaningful.length).toBe(images.length);
  });
});
