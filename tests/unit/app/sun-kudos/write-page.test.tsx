import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

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

describe("app/sun-kudos/write/page (Phase 4 stub destination for A.1)", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    authMock.mockClear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("anonymous request is redirected to /login (US7 carry-over)", async () => {
    authMock.mockResolvedValueOnce(null);

    const { default: KudosWriteStubPage } = await import(
      "@/app/sun-kudos/write/page"
    );

    await expect(KudosWriteStubPage()).rejects.toThrowError("__REDIRECT__:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("an `auth()` throw is treated as anonymous and still redirects to /login", async () => {
    authMock.mockRejectedValueOnce(new Error("auth boom"));

    const { default: KudosWriteStubPage } = await import(
      "@/app/sun-kudos/write/page"
    );

    await expect(KudosWriteStubPage()).rejects.toThrowError("__REDIRECT__:/login");
  });

  it("renders the placeholder copy + Back link when authenticated (Q-PLAN9 dialog OOS)", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u-1", name: "Tester" } });

    const { default: KudosWriteStubPage } = await import(
      "@/app/sun-kudos/write/page"
    );
    const result = await KudosWriteStubPage();

    expect(redirectMock).not.toHaveBeenCalled();
    render(result as React.ReactElement);
    expect(
      screen.getByRole("heading", {
        name: viCatalog["kudos.write.stub.title"],
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(viCatalog["kudos.write.stub.description"]),
    ).toBeInTheDocument();

    const backLink = screen.getByRole("link", {
      name: viCatalog["kudos.write.stub.back"],
    });
    expect(backLink).toHaveAttribute("href", "/sun-kudos");
  });
});
