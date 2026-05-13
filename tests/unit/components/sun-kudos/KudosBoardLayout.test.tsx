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

vi.mock("@/src/components/sun-kudos/KudosCreateInput", () => ({
  default: ({ locale }: { locale: string }) => (
    <button data-testid="kudos-create-input-stub" data-locale={locale}>
      write trigger
    </button>
  ),
}));

vi.mock("@/src/components/sun-kudos/KudosFeed", () => ({
  default: ({
    initialItems,
    initialCursor,
  }: {
    initialItems: { id: string }[];
    initialCursor: string | null;
  }) => (
    <div
      data-testid="kudos-feed-stub"
      data-items={initialItems.length}
      data-cursor={initialCursor ?? "null"}
    >
      feed
    </div>
  ),
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

  it("mounts KudosCreateInput inside the write input slot (Phase 4 T036) with the active locale", () => {
    render(
      <KudosBoardLayout
        locale="en-US"
        userName="Tester"
        userImage={null}
        unreadCount={0}
      />,
    );

    const slot = screen.getByTestId("kudos-write-input-slot");
    const trigger = screen.getByTestId("kudos-create-input-stub");
    expect(slot).toContainElement(trigger);
    expect(trigger).toHaveAttribute("data-locale", "en-US");
  });

  it("mounts KudosFeed inside the feed slot (Phase 5 T056) with the forwarded initial data", () => {
    render(
      <KudosBoardLayout
        locale="vi-VN"
        userName="Tester"
        userImage={null}
        unreadCount={0}
        feedInitialItems={
          // @ts-expect-error — stubbed Kudo shape: only `id` is read by the mock.
          [{ id: "k-1" }, { id: "k-2" }]
        }
        feedInitialCursor="2025-10-30T10:00:00.000Z|k-1"
      />,
    );
    const slot = screen.getByTestId("kudos-feed-slot");
    const feed = screen.getByTestId("kudos-feed-stub");
    expect(slot).toContainElement(feed);
    expect(feed).toHaveAttribute("data-items", "2");
    expect(feed).toHaveAttribute(
      "data-cursor",
      "2025-10-30T10:00:00.000Z|k-1",
    );
  });

  it("defaults the feed to an empty initial page when the page does not pass data (server skeleton path)", () => {
    render(
      <KudosBoardLayout
        locale="vi-VN"
        userName="Tester"
        userImage={null}
        unreadCount={0}
      />,
    );
    const feed = screen.getByTestId("kudos-feed-stub");
    expect(feed).toHaveAttribute("data-items", "0");
    expect(feed).toHaveAttribute("data-cursor", "null");
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
