import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((target: string): never => {
  throw new Error(`__REDIRECT__:${target}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const authMock = vi.fn();
vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/src/lib/cookies/saa-locale", () => ({
  getSaaLocale: vi.fn(async () => "vi-VN"),
}));

vi.mock("@/src/services/notification-service", () => ({
  getUnreadCount: vi.fn(async () => 0),
}));

vi.mock("@/src/components/sun-kudos/KudosBoardLayout", () => ({
  default: ({ locale }: { locale: string }) => (
    <div data-testid="kudos-board-layout-stub" data-locale={locale}>
      board
    </div>
  ),
}));

describe("app/sun-kudos/page (Phase 2 T022 — auth gate + skeleton render)", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    authMock.mockClear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("anonymous (auth resolves null) redirects to /login (US7 + Constitution IV A01)", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: SunKudosPage } = await import("@/app/sun-kudos/page");

    await expect(SunKudosPage()).rejects.toThrowError("__REDIRECT__:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("auth() throwing is treated as anonymous and still redirects to /login (defensive)", async () => {
    authMock.mockRejectedValueOnce(new Error("auth boom"));

    const { default: SunKudosPage } = await import("@/app/sun-kudos/page");

    await expect(SunKudosPage()).rejects.toThrowError("__REDIRECT__:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("authenticated user renders the KudosBoardLayout skeleton (no redirect) — replaces the legacy StubPage", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "u-1", name: "Tester", image: null },
    });

    const { default: SunKudosPage } = await import("@/app/sun-kudos/page");
    const result = await SunKudosPage();

    expect(redirectMock).not.toHaveBeenCalled();
    render(result as React.ReactElement);
    const board = screen.getByTestId("kudos-board-layout-stub");
    expect(board).toBeInTheDocument();
    expect(board).toHaveAttribute("data-locale", "vi-VN");
  });
});
