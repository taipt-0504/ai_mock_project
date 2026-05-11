import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SunKudosLayout from "@/app/sun-kudos/layout";

/**
 * Phase 2 T020. The `/sun-kudos` segment uses Next.js parallel routes: a
 * `children` slot for the page content, and a `@modal` slot for intercepting
 * Kudos detail visits. The layout MUST render both — otherwise the modal slot
 * never mounts when Phase 10 ships `(.)[id]/page.tsx`.
 */
describe("app/sun-kudos/layout — parallel routes scaffold", () => {
  it("renders both `children` and `modal` slots so intercepting routes can mount alongside the page", () => {
    render(
      <SunKudosLayout
        modal={<div data-testid="modal-slot">modal-content</div>}
      >
        <div data-testid="children-slot">children-content</div>
      </SunKudosLayout>,
    );

    expect(screen.getByTestId("children-slot")).toBeInTheDocument();
    expect(screen.getByTestId("modal-slot")).toBeInTheDocument();
  });
});
