import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/components/header/LanguageSelector", () => ({
  default: ({ locale }: { locale: string }) => (
    <div data-testid="language-selector-stub">{locale}</div>
  ),
}));

vi.mock("@/src/components/home/NotificationBell", () => ({
  default: () => <button data-testid="notification-bell-stub">bell</button>,
}));

vi.mock("@/src/components/home/ProfileButton", () => ({
  default: () => <button data-testid="profile-button-stub">profile</button>,
}));

import KudosBoardLayout from "@/src/components/sun-kudos/KudosBoardLayout";

/**
 * Phase 2 T023 + T024. KudosBoardLayout is a Server Component skeleton that
 * scaffolds the Live Board page: Header (slot props) + KV banner placeholder
 * + main content region + Footer. Each subsequent user-story phase mounts
 * its feature components into the named regions of this skeleton.
 */
describe("KudosBoardLayout — Phase 2 skeleton", () => {
  it("renders the global Header (banner landmark) with NavLinks active on /sun-kudos", () => {
    render(
      <KudosBoardLayout
        locale="vi-VN"
        userName="Tester"
        userImage={null}
        unreadCount={0}
      />,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    const kudosNavLink = screen
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/sun-kudos");
    expect(kudosNavLink).toBeDefined();
    expect(kudosNavLink).toHaveAttribute("aria-current", "page");
  });

  it("renders a single <main> landmark wrapping the board sections", () => {
    const { container } = render(
      <KudosBoardLayout
        locale="vi-VN"
        userName="Tester"
        userImage={null}
        unreadCount={0}
      />,
    );

    expect(container.querySelectorAll("main")).toHaveLength(1);
  });

  it("renders skeleton placeholders for the four main regions (write input, highlight, feed, sidebar)", () => {
    render(
      <KudosBoardLayout
        locale="vi-VN"
        userName="Tester"
        userImage={null}
        unreadCount={0}
      />,
    );

    expect(screen.getByTestId("kudos-write-input-slot")).toBeInTheDocument();
    expect(screen.getByTestId("kudos-highlight-slot")).toBeInTheDocument();
    expect(screen.getByTestId("kudos-feed-slot")).toBeInTheDocument();
    expect(screen.getByTestId("kudos-sidebar-slot")).toBeInTheDocument();
  });

  it("renders the global Footer (contentinfo landmark)", () => {
    render(
      <KudosBoardLayout
        locale="vi-VN"
        userName="Tester"
        userImage={null}
        unreadCount={0}
      />,
    );

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
