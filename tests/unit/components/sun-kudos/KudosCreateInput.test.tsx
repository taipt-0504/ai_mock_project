import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

import KudosCreateInput from "@/src/components/sun-kudos/KudosCreateInput";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";

/**
 * Phase 4 T035 — A.1 button ghi nhận. The component is a Client island that
 * renders a single button styled like the Figma A.1 input (pencil icon left,
 * placeholder text inside a 738×72 pill). Clicking navigates to the stub
 * `/sun-kudos/write` route; the actual Viết Kudo dialog (`ihQ26W78P2`) is OOS
 * per Q-PLAN9. Once the dialog ships, dialog success will call
 * `router.refresh()` (no `onCreated` callback). Tests cover the bilingual
 * surface so the en-US catalog parity test cannot regress unnoticed.
 */
describe("KudosCreateInput — A.1 button ghi nhận (T035)", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a single button element with the localized aria-label (default vi-VN)", () => {
    render(<KudosCreateInput locale="vi-VN" />);

    const trigger = screen.getByRole("button", {
      name: viCatalog["kudos.write.input.aria_label"],
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("type", "button");
  });

  it("renders the pencil (Pen) icon from /assets/sun-kudos/icons/pen.svg with 24x24 dimensions", () => {
    render(<KudosCreateInput locale="vi-VN" />);

    const penIcon = screen.getByAltText("");
    expect(penIcon).toHaveAttribute("src", "/assets/sun-kudos/icons/pen.svg");
    expect(penIcon).toHaveAttribute("width", "24");
    expect(penIcon).toHaveAttribute("height", "24");
  });

  it("shows the Vietnamese placeholder copy by default", () => {
    render(<KudosCreateInput locale="vi-VN" />);
    expect(
      screen.getByText(viCatalog["kudos.write.input.placeholder"]),
    ).toBeInTheDocument();
  });

  it("shows the English placeholder copy when locale is en-US", () => {
    render(<KudosCreateInput locale="en-US" />);
    expect(
      screen.getByText(enCatalog["kudos.write.input.placeholder"]),
    ).toBeInTheDocument();
  });

  it("navigates to /sun-kudos/write when clicked (Q-PLAN9: dialog OOS, route stubbed)", () => {
    render(<KudosCreateInput locale="vi-VN" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: viCatalog["kudos.write.input.aria_label"],
      }),
    );
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/sun-kudos/write");
  });

  it("matches the Figma A.1 pill geometry (738x72 max width, border-radius 68px, gold border tone)", () => {
    render(<KudosCreateInput locale="vi-VN" />);

    const trigger = screen.getByRole("button", {
      name: viCatalog["kudos.write.input.aria_label"],
    });
    expect(trigger.className).toContain("h-[72px]");
    expect(trigger.className).toContain("max-w-[738px]");
    expect(trigger.className).toContain("rounded-[68px]");
  });
});
