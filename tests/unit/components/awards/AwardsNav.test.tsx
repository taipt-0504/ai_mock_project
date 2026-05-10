import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AwardsNav from "@/src/components/awards/AwardsNav";
import { AWARDS, type AwardSlug } from "@/src/lib/awards/awards";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

const CANONICAL_ORDER: ReadonlyArray<AwardSlug> = [
  "top-talent",
  "top-project",
  "top-project-leader",
  "best-manager",
  "signature-2025-creator",
  "mvp",
];

function setHash(hash: string): void {
  window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
}

function mountCardsForObservation(): Record<AwardSlug, HTMLElement> {
  const stage = document.createElement("div");
  document.body.appendChild(stage);
  const elements: Partial<Record<AwardSlug, HTMLElement>> = {};
  for (const award of AWARDS) {
    const el = document.createElement("article");
    el.id = award.slug;
    stage.appendChild(el);
    elements[award.slug] = el;
  }
  return elements as Record<AwardSlug, HTMLElement>;
}

describe("AwardsNav (US2 / FR-006 / FR-007 / FR-014)", () => {
  beforeEach(() => {
    setHash("");
    document.body.innerHTML = "";
  });

  afterEach(() => {
    setHash("");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders six anchor links pointing to #<slug> in canonical order", () => {
    render(<AwardsNav locale="vi-VN" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(links.map((l) => l.getAttribute("href"))).toEqual(
      CANONICAL_ORDER.map((s) => `#${s}`),
    );
  });

  it("derives initial active slug from window.location.hash on mount", () => {
    setHash("#mvp");
    render(<AwardsNav locale="vi-VN" />);
    expect(screen.getByRole("link", { name: viCatalog["home.awards.mvp.title"] }))
      .toHaveAttribute("aria-current", "true");
  });

  it("falls back to top-talent when hash does not match a known slug (FR-007)", () => {
    setHash("#unknown-slug");
    render(<AwardsNav locale="vi-VN" />);
    expect(
      screen.getByRole("link", { name: viCatalog["home.awards.top_talent.title"] }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("flips aria-current to the clicked item and clears the previously active one", () => {
    mountCardsForObservation();
    render(<AwardsNav locale="vi-VN" />);

    const topTalent = screen.getByRole("link", {
      name: viCatalog["home.awards.top_talent.title"],
    });
    const bestManager = screen.getByRole("link", {
      name: viCatalog["home.awards.best_manager.title"],
    });

    expect(topTalent).toHaveAttribute("aria-current", "true");

    act(() => {
      fireEvent.click(bestManager, { button: 0 });
    });

    expect(bestManager).toHaveAttribute("aria-current", "true");
    expect(topTalent).not.toHaveAttribute("aria-current");
  });

  it("follows the topmost intersecting card with intersectionRatio >= 0.5", () => {
    const cards = mountCardsForObservation();
    render(<AwardsNav locale="vi-VN" />);

    act(() => {
      globalThis.__triggerIntersection([
        {
          target: cards["top-project"],
          isIntersecting: true,
          intersectionRatio: 0.7,
          boundingClientRect: new DOMRectReadOnly(0, 200, 100, 100),
        },
        {
          target: cards["top-project-leader"],
          isIntersecting: true,
          intersectionRatio: 0.6,
          boundingClientRect: new DOMRectReadOnly(0, 50, 100, 100),
        },
      ]);
    });

    expect(
      screen.getByRole("link", {
        name: viCatalog["home.awards.top_project_leader.title"],
      }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("re-syncs active slug when a hashchange event fires", () => {
    render(<AwardsNav locale="vi-VN" />);

    act(() => {
      setHash("#signature-2025-creator");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(
      screen.getByRole("link", {
        name: viCatalog["home.awards.signature_2025_creator.title"],
      }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("uses behavior 'auto' on click when prefers-reduced-motion: reduce", () => {
    const cards = mountCardsForObservation();
    const matchMediaSpy = vi
      .spyOn(window, "matchMedia")
      .mockImplementation(
        (query: string) =>
          ({
            matches: query === "(prefers-reduced-motion: reduce)",
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }) as MediaQueryList,
      );

    const scrollSpy = vi
      .spyOn(cards["mvp"], "scrollIntoView")
      .mockImplementation(() => {});

    render(<AwardsNav locale="vi-VN" />);

    act(() => {
      fireEvent.click(
        screen.getByRole("link", {
          name: viCatalog["home.awards.mvp.title"],
        }),
        { button: 0 },
      );
    });

    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    matchMediaSpy.mockRestore();
  });
});
