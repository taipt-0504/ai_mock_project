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
  clearSaaLocale,
  getSaaLocale,
  setSaaLocale,
} from "@/src/lib/cookies/saa-locale";

describe("saa-locale cookie helpers", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  describe("getSaaLocale", () => {
    it("returns the cookie value when it is in the supported allowlist", async () => {
      cookieStore.get.mockReturnValue({ value: "en-US" });
      await expect(getSaaLocale()).resolves.toBe("en-US");
      expect(cookieStore.delete).not.toHaveBeenCalled();
    });

    it("returns the default when the cookie is missing", async () => {
      cookieStore.get.mockReturnValue(undefined);
      await expect(getSaaLocale()).resolves.toBe("vi-VN");
      expect(cookieStore.delete).not.toHaveBeenCalled();
    });

    it("falls back to default AND clears the cookie when the value is tampered", async () => {
      cookieStore.get.mockReturnValue({ value: "../../etc/passwd" });
      await expect(getSaaLocale()).resolves.toBe("vi-VN");
      expect(cookieStore.delete).toHaveBeenCalledWith("saa_locale");
    });

    it("falls back to default when the value is a non-allowlisted BCP-47 string", async () => {
      cookieStore.get.mockReturnValue({ value: "fr-FR" });
      await expect(getSaaLocale()).resolves.toBe("vi-VN");
      expect(cookieStore.delete).toHaveBeenCalledWith("saa_locale");
    });
  });

  describe("setSaaLocale", () => {
    it("writes the cookie with the documented attributes", async () => {
      await setSaaLocale("en-US");
      expect(cookieStore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "saa_locale",
          value: "en-US",
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          secure: false, // NODE_ENV === "test"
        }),
      );
    });
  });

  describe("clearSaaLocale", () => {
    it("calls store.delete on the cookie name", async () => {
      await clearSaaLocale();
      expect(cookieStore.delete).toHaveBeenCalledWith("saa_locale");
    });
  });
});
