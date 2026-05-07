import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { toastMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));
vi.mock("@/src/components/ui/toast", () => ({
  toast: toastMock,
}));

import NotificationBell from "@/src/components/home/NotificationBell";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

describe("NotificationBell (US8 / FR-018 / Q6)", () => {
  beforeEach(() => {
    toastMock.mockReset();
  });

  it("renders the bell as a button with the localized aria-label", () => {
    render(<NotificationBell locale="vi-VN" unreadCount={0} />);
    expect(
      screen.getByRole("button", {
        name: viCatalog["home.notification.aria_label"],
      }),
    ).toBeInTheDocument();
  });

  it("shows the unread indicator when unreadCount > 0", () => {
    const { container } = render(
      <NotificationBell locale="vi-VN" unreadCount={3} />,
    );
    // Indicator is a decorative span with the saa-notification-dot bg.
    const dot = container.querySelector("span.bg-saa-notification-dot");
    expect(dot).not.toBeNull();
  });

  it("hides the unread indicator when unreadCount === 0 (FR-018 — no badge when zero)", () => {
    const { container } = render(
      <NotificationBell locale="vi-VN" unreadCount={0} />,
    );
    const dot = container.querySelector("span.bg-saa-notification-dot");
    expect(dot).toBeNull();
  });

  it("clicking the bell fires the localized 'Coming soon' toast (Q6 resolution)", () => {
    render(<NotificationBell locale="vi-VN" unreadCount={0} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: viCatalog["home.notification.aria_label"],
      }),
    );
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      viCatalog["home.notification.toast.coming_soon"],
    );
  });
});
