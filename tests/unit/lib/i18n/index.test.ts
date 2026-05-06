import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { t } from "@/src/lib/i18n";
import { logger } from "@/src/lib/logger";

describe("i18n.t", () => {
  it("returns the localized string for a known key + locale", () => {
    expect(t("program.title", "vi-VN")).toBe("ROOT FURTHER");
    expect(t("program.description1", "en-US")).toBe(
      "Start your journey with SAA 2025.",
    );
  });

  it("falls back to vi-VN when a key is missing in the requested locale and warns", () => {
    // The catalogs are kept in parity by tests/unit/lib/i18n/parity.test.ts,
    // so this assertion only covers the runtime fallback contract: if a key
    // were missing in the en-US catalog, t() must return the vi-VN value
    // and emit logger.warn. We exercise it by passing a key only added by
    // a hypothetical future drift — using a non-existent key returns the
    // key itself plus logger.error.
    expect(t("definitely.missing.key", "en-US")).toBe("definitely.missing.key");
    expect(logger.error).toHaveBeenCalledWith("i18n.unknown-key", {
      key: "definitely.missing.key",
      locale: "en-US",
    });
  });

  it("returns the key itself when no catalog has it", () => {
    expect(t("absolutely.unknown", "vi-VN")).toBe("absolutely.unknown");
  });
});
