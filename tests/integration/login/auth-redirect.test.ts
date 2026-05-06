import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, redirectMock, getSaaLocaleMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  redirectMock: vi.fn(),
  getSaaLocaleMock: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({ auth: authMock }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    // Next.js's runtime `redirect()` throws a special error that bubbles
    // out of the Server Component before any markup is produced. The test
    // mirrors that contract so callers can `expect(...).toThrow()`.
    const err = new Error("NEXT_REDIRECT");
    (err as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};308;`;
    throw err;
  },
}));

vi.mock("@/src/lib/cookies/saa-locale", () => ({
  getSaaLocale: getSaaLocaleMock,
}));

import LoginPage from "@/app/login/page";

describe("Login page — authenticated-visitor redirect (US2)", () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockReset();
    getSaaLocaleMock.mockResolvedValue("vi-VN");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls redirect('/') BEFORE producing any markup when a session exists", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });

    await expect(LoginPage()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/");
    // The page must NOT have proceeded to read the locale — that's wasted
    // work for a user we're about to redirect.
    expect(getSaaLocaleMock).not.toHaveBeenCalled();
  });

  it("renders Login (no redirect) when auth() returns null", async () => {
    authMock.mockResolvedValue(null);
    const result = await LoginPage();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("renders Login (no redirect) when auth() throws — DB outage edge case", async () => {
    authMock.mockRejectedValue(new Error("DB unreachable"));
    const result = await LoginPage();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
