import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { t } from "@/src/lib/i18n";

describe("i18n.t", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // The module is intentionally isomorphic and emits to `console`
    // (no server-only logger import). Spy so we can assert the diagnostic
    // call without leaking output to the test runner.
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("returns the localized string for a known key + locale", () => {
    expect(t("program.title", "vi-VN")).toBe("ROOT FURTHER");
    expect(t("program.description1", "en-US")).toBe(
      "Start your journey with SAA 2025.",
    );
  });

  it("returns the key itself AND logs an error when no catalog has it (US: parity test guards prod, this guards runtime)", () => {
    expect(t("definitely.missing.key", "en-US")).toBe("definitely.missing.key");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknown key "definitely.missing.key" for en-US'),
    );
  });

  it("returns the key itself when no catalog has it (different key, no auth coupling)", () => {
    expect(t("absolutely.unknown", "vi-VN")).toBe("absolutely.unknown");
    expect(errorSpy).toHaveBeenCalled();
  });
});
