import { describe, expect, it } from "vitest";

import {
  createKudoSchema,
  cursorSchema,
  kudoFilterQuerySchema,
  kudoLikeParamsSchema,
  spotlightSearchSchema,
} from "@/src/lib/validation/kudos";

/**
 * Phase 2 T017 — Zod validation contracts for the Kudos API surface. Each
 * schema is the boundary check between untyped HTTP input and typed service
 * arguments (Constitution Principle II — "Validate all external boundary
 * data … with a schema validator before use").
 */
describe("createKudoSchema (POST /api/kudos body)", () => {
  it("accepts minimal valid payload (content + receiverUserId)", () => {
    const parsed = createKudoSchema.parse({
      receiverUserId: "seed-user-2",
      content: "Cảm ơn bạn rất nhiều!",
    });
    expect(parsed.hashtagIds).toEqual([]);
    expect(parsed.imageUrls).toEqual([]);
  });

  it("rejects empty content (FR-022 — required)", () => {
    expect(() =>
      createKudoSchema.parse({ receiverUserId: "seed-user-2", content: "" }),
    ).toThrowError();
  });

  it("rejects content longer than 2000 chars (defense-in-depth cap)", () => {
    expect(() =>
      createKudoSchema.parse({
        receiverUserId: "seed-user-2",
        content: "x".repeat(2001),
      }),
    ).toThrowError();
  });

  it("rejects more than 5 hashtagIds (US1 #2 + plan defense)", () => {
    expect(() =>
      createKudoSchema.parse({
        receiverUserId: "seed-user-2",
        content: "ok",
        hashtagIds: ["a", "b", "c", "d", "e", "f"],
      }),
    ).toThrowError();
  });

  it("rejects more than 5 image URLs (plan defense)", () => {
    expect(() =>
      createKudoSchema.parse({
        receiverUserId: "seed-user-2",
        content: "ok",
        imageUrls: Array.from({ length: 6 }, (_, i) => `https://x/${i}`),
      }),
    ).toThrowError();
  });
});

describe("kudoFilterQuerySchema (GET /api/kudos query)", () => {
  it("accepts empty query (no filters → all Kudos)", () => {
    const parsed = kudoFilterQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
  });

  it("coerces numeric limit and clamps to 50", () => {
    expect(() => kudoFilterQuerySchema.parse({ limit: "51" })).toThrowError();
    expect(kudoFilterQuerySchema.parse({ limit: "10" }).limit).toBe(10);
  });

  it("accepts optional hashtag + dept + cursor strings", () => {
    const parsed = kudoFilterQuerySchema.parse({
      hashtag: "teamwork",
      dept: "Engineering",
      cursor: "2026-05-11T00:00:00.000Z|seed-kudo-1",
    });
    expect(parsed.hashtag).toBe("teamwork");
    expect(parsed.dept).toBe("Engineering");
    expect(parsed.cursor).toContain("seed-kudo-1");
  });
});

describe("kudoLikeParamsSchema (POST/DELETE /api/kudos/[id]/like)", () => {
  it("requires id to be a non-empty string", () => {
    expect(kudoLikeParamsSchema.parse({ id: "seed-kudo-1" }).id).toBe(
      "seed-kudo-1",
    );
    expect(() => kudoLikeParamsSchema.parse({ id: "" })).toThrowError();
  });
});

describe("spotlightSearchSchema (FR-004 — ≤100 chars)", () => {
  it("accepts up to 100 chars", () => {
    expect(spotlightSearchSchema.parse({ q: "a".repeat(100) }).q).toHaveLength(
      100,
    );
  });

  it("rejects 101 chars (FR-004)", () => {
    expect(() =>
      spotlightSearchSchema.parse({ q: "a".repeat(101) }),
    ).toThrowError();
  });

  it("rejects empty query (US5 #8 — required)", () => {
    expect(() => spotlightSearchSchema.parse({ q: "" })).toThrowError();
  });
});

describe("cursorSchema", () => {
  it("accepts the encoded `<isoDate>|<id>` shape produced by listFeed", () => {
    expect(
      cursorSchema.parse("2026-05-11T00:00:00.000Z|seed-kudo-1").id,
    ).toBe("seed-kudo-1");
  });

  it("rejects unparseable cursor (defense against tampering)", () => {
    expect(() => cursorSchema.parse("notacursor")).toThrowError();
    expect(() => cursorSchema.parse("|seed-kudo-1")).toThrowError();
  });
});
