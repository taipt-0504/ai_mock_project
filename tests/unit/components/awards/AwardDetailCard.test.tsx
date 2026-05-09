import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AwardDetailCard from "@/src/components/awards/AwardDetailCard";
import { AWARDS } from "@/src/lib/awards/awards";
import { formatVndAmount } from "@/src/lib/awards/format";
import enUS from "@/src/lib/i18n/catalogs/en-US.json";
import viVN from "@/src/lib/i18n/catalogs/vi-VN.json";

const TOP_TALENT = AWARDS.find((a) => a.slug === "top-talent")!;
const BEST_MANAGER = AWARDS.find((a) => a.slug === "best-manager")!;
const SIGNATURE = AWARDS.find((a) => a.slug === "signature-2025-creator")!;
const MVP = AWARDS.find((a) => a.slug === "mvp")!;

const vi = viVN as Record<string, string>;
const en = enUS as Record<string, string>;

describe("AwardDetailCard (FR-002 / FR-006 / FR-012)", () => {
  it("roots the card on <article id={slug}> so /awards#<slug> deep-links land here (FR-006)", () => {
    const { container } = render(
      <AwardDetailCard award={TOP_TALENT} locale="vi-VN" />,
    );
    const article = container.querySelector("article");
    expect(article).not.toBeNull();
    expect(article).toHaveAttribute("id", "top-talent");
  });

  it("renders the localized title via t(award.titleKey, locale)", () => {
    render(<AwardDetailCard award={TOP_TALENT} locale="vi-VN" />);
    expect(
      screen.getByRole("heading", { name: vi[TOP_TALENT.titleKey] }),
    ).toBeInTheDocument();
  });

  it("switches title to en-US when locale changes", () => {
    render(<AwardDetailCard award={MVP} locale="en-US" />);
    expect(
      screen.getByRole("heading", { name: en[MVP.titleKey] }),
    ).toBeInTheDocument();
  });

  it("renders the localized description via t(award.descriptionKey, locale)", () => {
    render(<AwardDetailCard award={TOP_TALENT} locale="vi-VN" />);
    expect(
      screen.getByText(vi[TOP_TALENT.descriptionKey]),
    ).toBeInTheDocument();
  });

  it("renders the thumbnail with the localized title as alt text (Edge Case: image load failure)", () => {
    render(<AwardDetailCard award={TOP_TALENT} locale="vi-VN" />);
    const img = screen.getByAltText(vi[TOP_TALENT.titleKey]);
    expect(img.getAttribute("alt")).toMatch(/\S/);
  });

  it("renders quantity line with localized label, count and unit when unitKey is set", () => {
    const { container } = render(
      <AwardDetailCard award={BEST_MANAGER} locale="vi-VN" />,
    );
    const quantityLabel = vi["awards.detail.quantity_label"];
    const unit = vi[BEST_MANAGER.unitKey!];
    const paragraphs = Array.from(container.querySelectorAll("p"));
    const match = paragraphs.find((p) => {
      const text = p.textContent ?? "";
      return (
        text.includes(quantityLabel) &&
        text.includes(String(BEST_MANAGER.quantity)) &&
        text.includes(unit)
      );
    });
    expect(match).toBeDefined();
  });

  it("renders quantity line WITHOUT unit segment when unitKey is null (MVP / Signature)", () => {
    const { container } = render(
      <AwardDetailCard award={MVP} locale="vi-VN" />,
    );
    const quantityLabel = vi["awards.detail.quantity_label"];
    const paragraphs = Array.from(container.querySelectorAll("p"));
    const quantityP = paragraphs.find((p) =>
      (p.textContent ?? "").includes(quantityLabel),
    );
    expect(quantityP).toBeDefined();
    const text = quantityP!.textContent ?? "";
    expect(text).toContain(String(MVP.quantity));
    // MVP must not surface any of the unit values inside the quantity row
    expect(text).not.toMatch(/Đơn vị|Tập thể|Cá nhân/);
  });

  it("renders value line with formatted VNĐ amount (FR-012)", () => {
    const { container } = render(
      <AwardDetailCard award={TOP_TALENT} locale="vi-VN" />,
    );
    const valueLabel = vi["awards.detail.value_label"];
    const formatted = formatVndAmount(TOP_TALENT.valueVND);
    const paragraphs = Array.from(container.querySelectorAll("p"));
    const labelP = paragraphs.find((p) =>
      (p.textContent ?? "").includes(valueLabel),
    );
    const amountP = paragraphs.find((p) =>
      (p.textContent ?? "").includes(formatted),
    );
    expect(labelP).toBeDefined();
    expect(amountP).toBeDefined();
  });

  it("renders BOTH value tiers for signature-2025-creator (5M / 8M)", () => {
    const { container } = render(
      <AwardDetailCard award={SIGNATURE} locale="vi-VN" />,
    );
    const article = container.querySelector("article")!;
    const scoped = within(article);
    expect(
      scoped.getByText((c) => c.includes(formatVndAmount(SIGNATURE.valueVND))),
    ).toBeInTheDocument();
    expect(
      scoped.getByText((c) =>
        c.includes(formatVndAmount(SIGNATURE.valueVNDSecondary!)),
      ),
    ).toBeInTheDocument();
  });

  it("does not render the secondary tier for awards without valueVNDSecondary", () => {
    render(<AwardDetailCard award={TOP_TALENT} locale="vi-VN" />);
    // 8.000.000 is signature's secondary — must not appear on Top Talent's card.
    expect(screen.queryByText(/8\.000\.000/)).toBeNull();
  });

  it("contains no interactive controls inside the card (read-only per FR-013)", () => {
    const { container } = render(
      <AwardDetailCard award={TOP_TALENT} locale="vi-VN" />,
    );
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelectorAll("input,select,textarea")).toHaveLength(0);
  });
});
