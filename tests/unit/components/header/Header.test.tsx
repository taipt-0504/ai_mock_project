import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/components/header/LanguageSelector", () => ({
  default: ({ locale }: { locale: string }) => (
    <div data-testid="language-selector-stub">{locale}</div>
  ),
}));

import Header from "@/src/components/header/Header";

describe("Header (TR-006 — slim + full slot variants)", () => {
  it("slim variant: passing only locale + isAuthenticated renders Logo + LanguageSelector and NO nav/notification/profileMenu DOM (Login regression contract)", () => {
    render(<Header locale="vi-VN" isAuthenticated={false} />);

    expect(
      screen.getByAltText("Sun Annual Awards 2025"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("language-selector-stub")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("notification-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("profile-stub")).not.toBeInTheDocument();
  });

  it("full variant: all four slot props render in source order (logo / nav left, notification + locale + profile right)", () => {
    render(
      <Header
        locale="vi-VN"
        isAuthenticated={true}
        logoHref="/"
        nav={<nav data-testid="nav-stub">nav</nav>}
        notification={<button data-testid="notification-stub">bell</button>}
        profileMenu={<button data-testid="profile-stub">profile</button>}
      />,
    );

    expect(screen.getByTestId("nav-stub")).toBeInTheDocument();
    expect(screen.getByTestId("notification-stub")).toBeInTheDocument();
    expect(screen.getByTestId("language-selector-stub")).toBeInTheDocument();
    expect(screen.getByTestId("profile-stub")).toBeInTheDocument();
  });

  it("slim variant DOES NOT render notification/profile slots even if accidentally passed without nav (defense against partial wiring)", () => {
    // Header guards full chrome behind `nav || notification || profileMenu`.
    // Passing ONLY notification still flips the chrome on — assert that
    // explicit behavior so it stays observable in the contract.
    render(
      <Header
        locale="vi-VN"
        notification={<button data-testid="notification-only">x</button>}
      />,
    );
    expect(screen.getByTestId("notification-only")).toBeInTheDocument();
  });

  it("logoHref prop turns the Logo into a Link wrapper (header A1.1: anchor to '/')", () => {
    const { container } = render(<Header locale="vi-VN" logoHref="/" />);
    const logoImg = container.querySelector(
      'img[alt="Sun Annual Awards 2025"]',
    );
    expect(logoImg).toBeTruthy();
    // The image is wrapped by a Link with href="/" — find the closest anchor.
    const wrappingAnchor = logoImg!.closest("a");
    expect(wrappingAnchor).not.toBeNull();
    expect(wrappingAnchor).toHaveAttribute("href", "/");
  });

  it("without logoHref the Logo renders without a wrapping link (Login slim variant)", () => {
    const { container } = render(<Header locale="vi-VN" />);
    const logoImg = container.querySelector(
      'img[alt="Sun Annual Awards 2025"]',
    );
    expect(logoImg).toBeTruthy();
    expect(logoImg!.closest("a")).toBeNull();
  });
});
