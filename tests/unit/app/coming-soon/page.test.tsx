import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

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

describe("app/coming-soon/page (Prelaunch FR-002 / FR-008 / FR-009)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    redirectMock.mockClear();
    authMock.mockClear();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("future SAA_LAUNCH_AT — renders the prelaunch screen and does NOT call auth() (FR-002)", async () => {
    process.env.SAA_LAUNCH_AT = "2099-01-01T00:00:00Z";

    const { default: ComingSoon } = await import("@/app/coming-soon/page");
    const result = await ComingSoon();

    expect(authMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    // Result must be a React element (Server Component returns JSX).
    expect(result).toBeDefined();
    expect((result as { type?: unknown }).type).toBeDefined();
  });

  it("past SAA_LAUNCH_AT — defensively redirects to '/' (FR-008 backstop)", async () => {
    process.env.SAA_LAUNCH_AT = "2000-01-01T00:00:00Z";

    const { default: ComingSoon } = await import("@/app/coming-soon/page");

    await expect(ComingSoon()).rejects.toThrowError("__REDIRECT__:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
    expect(redirectMock).toHaveBeenCalledTimes(1);
    expect(authMock).not.toHaveBeenCalled();
  });

  it("null/unset SAA_LAUNCH_AT — renders the prelaunch screen with placeholders (FR-009 fail-closed)", async () => {
    delete process.env.SAA_LAUNCH_AT;

    const { default: ComingSoon } = await import("@/app/coming-soon/page");
    const result = await ComingSoon();

    expect(redirectMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("malformed SAA_LAUNCH_AT — also fails closed and renders the screen", async () => {
    process.env.SAA_LAUNCH_AT = "not-a-date";

    const { default: ComingSoon } = await import("@/app/coming-soon/page");
    const result = await ComingSoon();

    expect(redirectMock).not.toHaveBeenCalled();
    expect(authMock).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
