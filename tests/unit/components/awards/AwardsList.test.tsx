import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AwardsList from "@/src/components/awards/AwardsList";
import type { AwardSlug } from "@/src/lib/awards/awards";

const CANONICAL_ORDER: ReadonlyArray<AwardSlug> = [
  "top-talent",
  "top-project",
  "top-project-leader",
  "best-manager",
  "signature-2025-creator",
  "mvp",
];

describe("AwardsList (FR-002 / FR-003)", () => {
  it("renders exactly six <article> elements", () => {
    const { container } = render(<AwardsList locale="vi-VN" />);
    expect(container.querySelectorAll("article")).toHaveLength(6);
  });

  it("emits the six article ids in the canonical slug order", () => {
    const { container } = render(<AwardsList locale="vi-VN" />);
    const ids = Array.from(container.querySelectorAll("article")).map((el) =>
      el.getAttribute("id"),
    );
    expect(ids).toEqual(CANONICAL_ORDER);
  });
});
