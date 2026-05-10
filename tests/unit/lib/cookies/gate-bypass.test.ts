import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookieStore),
}));

vi.mock("@/src/lib/config", () => ({
  config: { NODE_ENV: "test" },
}));

import {
  GATE_BYPASS_COOKIE,
  clearGateBypass,
  hasGateBypassCookie,
  isGateBypassActive,
  setGateBypass,
} from "@/src/lib/cookies/gate-bypass";

describe("gate-bypass cookie helpers (Phase 16 demo bypass)", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  describe("isGateBypassActive (server component reader)", () => {
    it("returns true only when the cookie value is exactly the documented sentinel '1'", async () => {
      cookieStore.get.mockReturnValue({ value: "1" });
      await expect(isGateBypassActive()).resolves.toBe(true);
    });

    it("returns false when the cookie is missing", async () => {
      cookieStore.get.mockReturnValue(undefined);
      await expect(isGateBypassActive()).resolves.toBe(false);
    });

    it("returns false when the cookie value is anything other than '1' (tamper-resistant)", async () => {
      cookieStore.get.mockReturnValue({ value: "true" });
      await expect(isGateBypassActive()).resolves.toBe(false);

      cookieStore.get.mockReturnValue({ value: "yes" });
      await expect(isGateBypassActive()).resolves.toBe(false);

      cookieStore.get.mockReturnValue({ value: "" });
      await expect(isGateBypassActive()).resolves.toBe(false);
    });
  });

  describe("setGateBypass", () => {
    it("writes the documented cookie attributes (httpOnly, lax, 7-day TTL)", async () => {
      await setGateBypass();
      expect(cookieStore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: GATE_BYPASS_COOKIE,
          value: "1",
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          secure: false, // NODE_ENV === "test"
        }),
      );
    });
  });

  describe("clearGateBypass", () => {
    it("calls store.delete on the documented cookie name", async () => {
      await clearGateBypass();
      expect(cookieStore.delete).toHaveBeenCalledWith(GATE_BYPASS_COOKIE);
    });
  });

  describe("hasGateBypassCookie (proxy reader — works on a NextRequest cookie store)", () => {
    it("returns true when the request carries `saa_gate_bypass=1`", () => {
      const request = {
        cookies: {
          get: (name: string) =>
            name === GATE_BYPASS_COOKIE ? { value: "1" } : undefined,
        },
      };
      expect(hasGateBypassCookie(request)).toBe(true);
    });

    it("returns false when the cookie is absent", () => {
      const request = {
        cookies: { get: () => undefined },
      };
      expect(hasGateBypassCookie(request)).toBe(false);
    });

    it("returns false when the cookie carries any non-'1' value", () => {
      const request = {
        cookies: { get: () => ({ value: "yes" }) },
      };
      expect(hasGateBypassCookie(request)).toBe(false);
    });
  });

  describe("GATE_BYPASS_COOKIE constant", () => {
    it("is the documented stable cookie name (load-bearing — README + proxy + actions all read it)", () => {
      expect(GATE_BYPASS_COOKIE).toBe("saa_gate_bypass");
    });
  });
});
