import { describe, expect, it } from "vitest";

import { AWARDS, type AwardSlug } from "@/src/lib/awards/awards";
import enUS from "@/src/lib/i18n/catalogs/en-US.json";
import viVN from "@/src/lib/i18n/catalogs/vi-VN.json";

const CANONICAL_SLUGS: ReadonlyArray<AwardSlug> = [
  "top-talent",
  "top-project",
  "top-project-leader",
  "best-manager",
  "signature-2025-creator",
  "mvp",
];

describe("AWARDS static config", () => {
  it("contains exactly six entries", () => {
    expect(AWARDS).toHaveLength(6);
  });

  it("emits the canonical slugs in deterministic order (FR-020)", () => {
    expect(AWARDS.map((a) => a.slug)).toEqual(CANONICAL_SLUGS);
  });

  it("has unique slugs across all entries", () => {
    const slugs = AWARDS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique ids across all entries", () => {
    const ids = AWARDS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references a titleKey that resolves in BOTH vi-VN and en-US catalogs", () => {
    const vi = viVN as Record<string, string>;
    const en = enUS as Record<string, string>;
    for (const award of AWARDS) {
      expect(vi[award.titleKey], `vi-VN/${award.titleKey}`).toMatch(/\S/);
      expect(en[award.titleKey], `en-US/${award.titleKey}`).toMatch(/\S/);
    }
  });

  it("references a descriptionKey that resolves in BOTH vi-VN and en-US catalogs", () => {
    const vi = viVN as Record<string, string>;
    const en = enUS as Record<string, string>;
    for (const award of AWARDS) {
      expect(vi[award.descriptionKey], `vi-VN/${award.descriptionKey}`).toMatch(/\S/);
      expect(en[award.descriptionKey], `en-US/${award.descriptionKey}`).toMatch(/\S/);
    }
  });

  it("ships positive label dimensions for each entry (used by next/image)", () => {
    for (const award of AWARDS) {
      expect(award.labelWidth, `labelWidth for ${award.slug}`).toBeGreaterThan(0);
      expect(award.labelHeight, `labelHeight for ${award.slug}`).toBeGreaterThan(0);
    }
  });

  it("points each labelAsset at the public/assets/home/images directory", () => {
    for (const award of AWARDS) {
      expect(award.labelAsset, `labelAsset for ${award.slug}`).toMatch(
        /^\/assets\/home\/images\/award-[a-z0-9-]+\.(png|svg|jpg|jpeg|webp)$/,
      );
    }
  });

  it("ships a positive quantity for every entry", () => {
    for (const award of AWARDS) {
      expect(award.quantity, `quantity for ${award.slug}`).toBeGreaterThan(0);
    }
  });

  it("ships a positive primary VNĐ value for every entry", () => {
    for (const award of AWARDS) {
      expect(award.valueVND, `valueVND for ${award.slug}`).toBeGreaterThan(0);
    }
  });

  it("uses unitKey === null XOR a non-empty key under awards.detail.unit.*", () => {
    for (const award of AWARDS) {
      if (award.unitKey === null) {
        expect(award.unitKey).toBeNull();
      } else {
        expect(award.unitKey, `unitKey for ${award.slug}`).toMatch(
          /^awards\.detail\.unit\..+/,
        );
      }
    }
  });

  it("references unitKeys that resolve in BOTH vi-VN and en-US catalogs", () => {
    const vi = viVN as Record<string, string>;
    const en = enUS as Record<string, string>;
    for (const award of AWARDS) {
      if (award.unitKey === null) continue;
      expect(vi[award.unitKey], `vi-VN/${award.unitKey}`).toMatch(/\S/);
      expect(en[award.unitKey], `en-US/${award.unitKey}`).toMatch(/\S/);
    }
  });

  it("provides valueVNDSecondary only for signature-2025-creator (and matches 8_000_000)", () => {
    for (const award of AWARDS) {
      if (award.slug === "signature-2025-creator") {
        expect(award.valueVNDSecondary).toBe(8_000_000);
      } else {
        expect(
          award.valueVNDSecondary,
          `valueVNDSecondary for ${award.slug}`,
        ).toBeNull();
      }
    }
  });
});
