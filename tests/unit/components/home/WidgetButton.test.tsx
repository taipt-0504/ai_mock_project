import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));
vi.mock("@/src/components/ui/toast", () => ({
  toast: toastMock,
}));

import WidgetButton from "@/src/components/home/WidgetButton";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("WidgetButton (US7 — floating quick-action button)", () => {
  beforeEach(() => {
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a Quick actions toolbar containing two action buttons (Write Kudos / Read general rules)", () => {
    render(<WidgetButton locale="vi-VN" />);
    const toolbar = screen.getByRole("toolbar", { name: /quick actions/i });
    expect(toolbar).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: viCatalog["home.fab.write_kudos"] }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: viCatalog["home.fab.read_rules"] }),
    ).toBeInTheDocument();
  });

  it("clicking the 'Write Kudos' button fires the localized 'Coming soon' toast", () => {
    render(<WidgetButton locale="vi-VN" />);
    fireEvent.click(
      screen.getByRole("button", { name: viCatalog["home.fab.write_kudos"] }),
    );
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      viCatalog["home.notification.toast.coming_soon"],
    );
  });

  it("clicking the 'Read general rules' button fires the same Coming soon toast (separate invocation)", () => {
    render(<WidgetButton locale="vi-VN" />);
    fireEvent.click(
      screen.getByRole("button", { name: viCatalog["home.fab.read_rules"] }),
    );
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      viCatalog["home.notification.toast.coming_soon"],
    );
  });

  it("is positioned as a floating bottom-right widget (fixed bottom-X right-X Tailwind utility)", () => {
    render(<WidgetButton locale="vi-VN" />);
    const toolbar = screen.getByRole("toolbar", { name: /quick actions/i });
    // Tailwind classes are stable contracts here — guard the floating anchor.
    expect(toolbar.className).toMatch(/\bfixed\b/);
    expect(toolbar.className).toMatch(/\bbottom-/);
    expect(toolbar.className).toMatch(/\bright-/);
  });
});
