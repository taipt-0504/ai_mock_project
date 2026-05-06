import { describe, expect, it } from "vitest";

import enUS from "@/src/lib/i18n/catalogs/en-US.json";
import viVN from "@/src/lib/i18n/catalogs/vi-VN.json";

/**
 * Catalog parity: every key MUST exist in every supported locale catalog.
 * This is the only place where catalog drift is detected at build time.
 */
describe("i18n catalog parity", () => {
  const viKeys = Object.keys(viVN).sort();
  const enKeys = Object.keys(enUS).sort();

  it("vi-VN and en-US have identical key sets", () => {
    expect(enKeys).toEqual(viKeys);
  });

  it("no value is empty in either catalog", () => {
    for (const [k, v] of Object.entries(viVN)) {
      expect(v, `vi-VN/${k}`).toMatch(/\S/);
    }
    for (const [k, v] of Object.entries(enUS)) {
      expect(v, `en-US/${k}`).toMatch(/\S/);
    }
  });
});
