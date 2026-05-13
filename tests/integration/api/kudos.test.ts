import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));
vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import { GET, POST } from "@/app/api/kudos/route";
import { prisma } from "@/src/lib/prisma";
import { kudosService } from "@/src/services/kudos-service";
import { clearAuthTables, createTestUser } from "@/tests/fixtures/users";

/**
 * Phase 4 T031 — kudos-service.create + POST /api/kudos integration.
 *
 * Drives the real Postgres test DB. The service tests assert the atomic
 * counter update + hashtag dedup + image insert contract; the route tests
 * assert auth gating and Zod-driven 400 responses. Together they replace the
 * "TDD red" mandate from `tasks.md` Phase 4 prerequisite.
 */

async function makeReceiver(id: string): Promise<string> {
  const user = await createTestUser({
    id,
    email: `${id}@example.com`,
    name: `Receiver ${id}`,
  });
  return user.id;
}

async function makeSender(id: string): Promise<string> {
  const user = await createTestUser({
    id,
    email: `${id}@example.com`,
    name: `Sender ${id}`,
  });
  return user.id;
}

async function makeHashtag(slug: string): Promise<string> {
  const hashtag = await prisma.hashtag.upsert({
    where: { slug },
    create: { name: slug.replace(/-/g, " "), slug },
    update: {},
  });
  return hashtag.id;
}

async function clearKudoTables(): Promise<void> {
  await prisma.kudoLike.deleteMany();
  await prisma.kudoImage.deleteMany();
  await prisma.kudoHashtag.deleteMany();
  await prisma.kudo.deleteMany();
  await prisma.hashtag.deleteMany();
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/kudos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("kudos-service.create (T031 service contract)", () => {
  beforeEach(async () => {
    await clearKudoTables();
    await clearAuthTables();
    authMock.mockReset();
  });

  afterAll(async () => {
    await clearKudoTables();
    await clearAuthTables();
    await prisma.$disconnect();
  });

  it("persists a Kudo row + many-to-many hashtags + images + increments both sender and receiver counters atomically", async () => {
    const senderId = await makeSender("kudos-service-sender");
    const receiverId = await makeReceiver("kudos-service-receiver");
    const hashtagA = await makeHashtag("dedicated");
    const hashtagB = await makeHashtag("teamwork");

    const result = await kudosService.create(
      {
        receiverUserId: receiverId,
        content: "Cảm ơn bạn vì đã giúp đỡ team trong release qua!",
        hashtagIds: [hashtagA, hashtagB],
        imageUrls: [
          "https://picsum.photos/seed/k1/600/400",
          "https://picsum.photos/seed/k2/600/400",
        ],
      },
      { user: { id: senderId } },
    );

    expect(result.id).toMatch(/.+/);
    expect(result.content).toContain("Cảm ơn");
    expect(result.heartCount).toBe(0);
    expect(result.sender.id).toBe(senderId);
    expect(result.receiver.id).toBe(receiverId);
    expect(result.hashtags.map((h) => h.id).sort()).toEqual(
      [hashtagA, hashtagB].sort(),
    );
    expect(result.images).toHaveLength(2);

    const refreshedSender = await prisma.user.findUniqueOrThrow({
      where: { id: senderId },
    });
    expect(refreshedSender.kudosSentCount).toBe(1);

    const refreshedReceiver = await prisma.user.findUniqueOrThrow({
      where: { id: receiverId },
    });
    expect(refreshedReceiver.kudosReceivedCount).toBe(1);

    const persistedKudo = await prisma.kudo.findUniqueOrThrow({
      where: { id: result.id },
      include: { hashtags: true, images: true },
    });
    expect(persistedKudo.hashtags).toHaveLength(2);
    expect(persistedKudo.images).toHaveLength(2);
  });

  it("deduplicates repeated hashtag IDs so only one junction row is written per (kudo, hashtag)", async () => {
    const senderId = await makeSender("kudos-service-dedup-sender");
    const receiverId = await makeReceiver("kudos-service-dedup-receiver");
    const hashtagA = await makeHashtag("idol");

    const result = await kudosService.create(
      {
        receiverUserId: receiverId,
        content: "Idol giới trẻ!",
        hashtagIds: [hashtagA, hashtagA, hashtagA],
        imageUrls: [],
      },
      { user: { id: senderId } },
    );

    const persisted = await prisma.kudo.findUniqueOrThrow({
      where: { id: result.id },
      include: { hashtags: true },
    });
    expect(persisted.hashtags).toHaveLength(1);
  });

  it("rejects content longer than the 2000-char limit with a ZodError (Constitution II validation rule)", async () => {
    const senderId = await makeSender("kudos-service-long-sender");
    const receiverId = await makeReceiver("kudos-service-long-receiver");

    await expect(
      kudosService.create(
        {
          receiverUserId: receiverId,
          content: "x".repeat(2001),
          hashtagIds: [],
          imageUrls: [],
        },
        { user: { id: senderId } },
      ),
    ).rejects.toBeInstanceOf(ZodError);

    expect(await prisma.kudo.count()).toBe(0);
  });

  it("rejects blank content (FR-001) with a ZodError and persists no row", async () => {
    const senderId = await makeSender("kudos-service-blank-sender");
    const receiverId = await makeReceiver("kudos-service-blank-receiver");

    await expect(
      kudosService.create(
        {
          receiverUserId: receiverId,
          content: "",
          hashtagIds: [],
          imageUrls: [],
        },
        { user: { id: senderId } },
      ),
    ).rejects.toBeInstanceOf(ZodError);

    expect(await prisma.kudo.count()).toBe(0);
  });

  it("rejects more than 5 hashtags with a ZodError (createKudoSchema ceiling)", async () => {
    const senderId = await makeSender("kudos-service-htmax-sender");
    const receiverId = await makeReceiver("kudos-service-htmax-receiver");
    const six = await Promise.all(
      ["a", "b", "c", "d", "e", "f"].map((n) => makeHashtag(`htmax-${n}`)),
    );

    await expect(
      kudosService.create(
        {
          receiverUserId: receiverId,
          content: "Quá nhiều hashtag",
          hashtagIds: six,
          imageUrls: [],
        },
        { user: { id: senderId } },
      ),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("rejects more than 5 image URLs with a ZodError", async () => {
    const senderId = await makeSender("kudos-service-imgmax-sender");
    const receiverId = await makeReceiver("kudos-service-imgmax-receiver");

    const urls = Array.from(
      { length: 6 },
      (_v, i) => `https://picsum.photos/seed/imgmax${i}/600/400`,
    );

    await expect(
      kudosService.create(
        {
          receiverUserId: receiverId,
          content: "Quá nhiều ảnh",
          hashtagIds: [],
          imageUrls: urls,
        },
        { user: { id: senderId } },
      ),
    ).rejects.toBeInstanceOf(ZodError);
  });
});

describe("POST /api/kudos (T034 route contract)", () => {
  beforeEach(async () => {
    await clearKudoTables();
    await clearAuthTables();
    authMock.mockReset();
  });

  afterAll(async () => {
    await clearKudoTables();
    await clearAuthTables();
    await prisma.$disconnect();
  });

  it("returns 401 when there is no session (US7 auth-gate carry-over)", async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(
      jsonRequest({
        receiverUserId: "anyone",
        content: "hi",
        hashtagIds: [],
        imageUrls: [],
      }),
    );
    expect(res.status).toBe(401);
    expect(await prisma.kudo.count()).toBe(0);
  });

  it("returns 400 for malformed JSON", async () => {
    const senderId = await makeSender("route-malformed-sender");
    authMock.mockResolvedValue({ user: { id: senderId } });

    const req = new Request("http://localhost/api/kudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when the body fails Zod validation (blank content)", async () => {
    const senderId = await makeSender("route-blank-sender");
    const receiverId = await makeReceiver("route-blank-receiver");
    authMock.mockResolvedValue({ user: { id: senderId } });

    const res = await POST(
      jsonRequest({
        receiverUserId: receiverId,
        content: "",
        hashtagIds: [],
        imageUrls: [],
      }),
    );
    expect(res.status).toBe(400);
    expect(await prisma.kudo.count()).toBe(0);
  });

  it("returns 201 and persists the Kudo when the body is valid", async () => {
    const senderId = await makeSender("route-happy-sender");
    const receiverId = await makeReceiver("route-happy-receiver");
    authMock.mockResolvedValue({ user: { id: senderId } });

    const res = await POST(
      jsonRequest({
        receiverUserId: receiverId,
        content: "Cảm ơn bạn về sprint review!",
        hashtagIds: [],
        imageUrls: [],
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; content: string };
    expect(body.id).toMatch(/.+/);
    expect(body.content).toContain("Cảm ơn");
    expect(await prisma.kudo.count()).toBe(1);

    const senderRow = await prisma.user.findUniqueOrThrow({
      where: { id: senderId },
    });
    expect(senderRow.kudosSentCount).toBe(1);
  });
});

/**
 * Phase 5 T039 — listFeed + GET /api/kudos.
 *
 * Seeds a deterministic feed (5 Kudos, 2 departments, 3 hashtags) and
 * exercises cursor pagination, hashtag filter, department filter (Q-LB5 OR
 * sender/receiver), and the AND composition of the two filters (Q-LB6).
 */

type FeedSeed = {
  ownerId: string;
  alphaDeptId: string;
  betaDeptId: string;
  hashtagDedicated: string;
  hashtagTeamwork: string;
  hashtagIdol: string;
  kudoOldest: string;
  kudoMid1: string;
  kudoMid2: string;
  kudoNewest: string;
  kudoBetaOnly: string;
};

async function seedFeed(): Promise<FeedSeed> {
  const alpha = await prisma.department.upsert({
    where: { name: "FeedAlpha" },
    create: { name: "FeedAlpha" },
    update: {},
  });
  const beta = await prisma.department.upsert({
    where: { name: "FeedBeta" },
    create: { name: "FeedBeta" },
    update: {},
  });

  const owner = await createTestUser({
    id: "feed-owner",
    email: "feed-owner@example.com",
    name: "Owner",
    departmentId: alpha.id,
  });
  const partnerAlpha = await createTestUser({
    id: "feed-partner-alpha",
    email: "feed-partner-alpha@example.com",
    name: "Partner Alpha",
    departmentId: alpha.id,
  });
  const partnerBeta = await createTestUser({
    id: "feed-partner-beta",
    email: "feed-partner-beta@example.com",
    name: "Partner Beta",
    departmentId: beta.id,
  });

  const dedicated = await prisma.hashtag.upsert({
    where: { slug: "dedicated" },
    create: { name: "Dedicated", slug: "dedicated" },
    update: {},
  });
  const teamwork = await prisma.hashtag.upsert({
    where: { slug: "teamwork" },
    create: { name: "Teamwork", slug: "teamwork" },
    update: {},
  });
  const idol = await prisma.hashtag.upsert({
    where: { slug: "idol" },
    create: { name: "Idol", slug: "idol" },
    update: {},
  });

  // Create 5 kudos with deterministic createdAt for cursor assertions.
  const baseTime = new Date("2025-10-01T00:00:00.000Z").getTime();
  async function mkKudo(opts: {
    id: string;
    minutesAfter: number;
    senderId: string;
    receiverId: string;
    hashtagIds: string[];
  }) {
    return prisma.kudo.create({
      data: {
        id: opts.id,
        senderUserId: opts.senderId,
        receiverUserId: opts.receiverId,
        content: `content ${opts.id}`,
        createdAt: new Date(baseTime + opts.minutesAfter * 60_000),
        hashtags: {
          create: opts.hashtagIds.map((hashtagId) => ({ hashtagId })),
        },
      },
    });
  }

  await mkKudo({
    id: "feed-kudo-oldest",
    minutesAfter: 0,
    senderId: owner.id,
    receiverId: partnerAlpha.id,
    hashtagIds: [dedicated.id],
  });
  await mkKudo({
    id: "feed-kudo-mid-1",
    minutesAfter: 10,
    senderId: partnerAlpha.id,
    receiverId: owner.id,
    hashtagIds: [teamwork.id],
  });
  await mkKudo({
    id: "feed-kudo-mid-2",
    minutesAfter: 20,
    senderId: owner.id,
    receiverId: partnerBeta.id,
    hashtagIds: [dedicated.id, teamwork.id],
  });
  await mkKudo({
    id: "feed-kudo-newest",
    minutesAfter: 30,
    senderId: partnerBeta.id,
    receiverId: owner.id,
    hashtagIds: [idol.id, teamwork.id],
  });
  await mkKudo({
    id: "feed-kudo-beta-only",
    minutesAfter: 25,
    senderId: partnerBeta.id,
    receiverId: partnerBeta.id,
    hashtagIds: [dedicated.id],
  });

  return {
    ownerId: owner.id,
    alphaDeptId: alpha.id,
    betaDeptId: beta.id,
    hashtagDedicated: dedicated.id,
    hashtagTeamwork: teamwork.id,
    hashtagIdol: idol.id,
    kudoOldest: "feed-kudo-oldest",
    kudoMid1: "feed-kudo-mid-1",
    kudoMid2: "feed-kudo-mid-2",
    kudoNewest: "feed-kudo-newest",
    kudoBetaOnly: "feed-kudo-beta-only",
  };
}

function getRequest(path: string): Request {
  return new Request(`http://localhost${path}`, { method: "GET" });
}

describe("kudos-service.listFeed (T039 service contract)", () => {
  beforeEach(async () => {
    await clearKudoTables();
    await clearAuthTables();
    await prisma.department.deleteMany();
    authMock.mockReset();
  });

  afterAll(async () => {
    await clearKudoTables();
    await clearAuthTables();
    await prisma.department.deleteMany();
    await prisma.$disconnect();
  });

  it("returns kudos sorted by (createdAt DESC, id DESC) with the limit + nextCursor", async () => {
    const seed = await seedFeed();
    const page = await kudosService.listFeed({}, { limit: 2 });
    expect(page.items.map((k) => k.id)).toEqual([
      seed.kudoNewest,
      seed.kudoBetaOnly,
    ]);
    expect(page.nextCursor).not.toBeNull();
    const [iso, id] = page.nextCursor!.split("|");
    expect(id).toBe(seed.kudoBetaOnly);
    expect(Number.isNaN(Date.parse(iso!))).toBe(false);
  });

  it("returns nextCursor=null when the page is the final page", async () => {
    await seedFeed();
    const page = await kudosService.listFeed({}, { limit: 50 });
    expect(page.items.length).toBe(5);
    expect(page.nextCursor).toBeNull();
  });

  it("cursor-paginates with `(createdAt, id) < cursor` semantics across pages", async () => {
    const seed = await seedFeed();
    const first = await kudosService.listFeed({}, { limit: 2 });
    expect(first.items.map((k) => k.id)).toEqual([
      seed.kudoNewest,
      seed.kudoBetaOnly,
    ]);
    const second = await kudosService.listFeed({}, {
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.items.map((k) => k.id)).toEqual([
      seed.kudoMid2,
      seed.kudoMid1,
    ]);
    const third = await kudosService.listFeed({}, {
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });
    expect(third.items.map((k) => k.id)).toEqual([seed.kudoOldest]);
    expect(third.nextCursor).toBeNull();
  });

  it("filters by hashtag slug — only kudos tagged with the slug are returned", async () => {
    const seed = await seedFeed();
    const page = await kudosService.listFeed(
      { hashtag: "dedicated" },
      { limit: 50 },
    );
    expect(page.items.map((k) => k.id).sort()).toEqual(
      [seed.kudoOldest, seed.kudoMid2, seed.kudoBetaOnly].sort(),
    );
  });

  it("filters by department id — match when EITHER sender OR receiver is in the department (Q-LB5)", async () => {
    const seed = await seedFeed();
    const page = await kudosService.listFeed(
      { dept: seed.betaDeptId },
      { limit: 50 },
    );
    expect(page.items.map((k) => k.id).sort()).toEqual(
      [seed.kudoMid2, seed.kudoNewest, seed.kudoBetaOnly].sort(),
    );
  });

  it("ANDs hashtag + dept filters (Q-LB6) — both must hold for a kudo to appear", async () => {
    const seed = await seedFeed();
    const page = await kudosService.listFeed(
      { hashtag: "dedicated", dept: seed.betaDeptId },
      { limit: 50 },
    );
    expect(page.items.map((k) => k.id).sort()).toEqual(
      [seed.kudoMid2, seed.kudoBetaOnly].sort(),
    );
  });

  it("returns an empty page when no kudos match the filter", async () => {
    await seedFeed();
    const page = await kudosService.listFeed(
      { hashtag: "no-such-slug" },
      { limit: 50 },
    );
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});

describe("GET /api/kudos (T039 route contract)", () => {
  beforeEach(async () => {
    await clearKudoTables();
    await clearAuthTables();
    await prisma.department.deleteMany();
    authMock.mockReset();
  });

  afterAll(async () => {
    await clearKudoTables();
    await clearAuthTables();
    await prisma.department.deleteMany();
    await prisma.$disconnect();
  });

  it("returns 401 for an anonymous request (auth-gate carry-over from T028)", async () => {
    authMock.mockResolvedValue(null);
    const res = await GET(getRequest("/api/kudos"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when the cursor is malformed", async () => {
    const seed = await seedFeed();
    authMock.mockResolvedValue({ user: { id: seed.ownerId } });
    const res = await GET(getRequest("/api/kudos?cursor=not-a-cursor"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when limit exceeds the 1-50 range", async () => {
    const seed = await seedFeed();
    authMock.mockResolvedValue({ user: { id: seed.ownerId } });
    const res = await GET(getRequest("/api/kudos?limit=999"));
    expect(res.status).toBe(400);
  });

  it("returns 200 with `{ items, nextCursor }` shape on success", async () => {
    const seed = await seedFeed();
    authMock.mockResolvedValue({ user: { id: seed.ownerId } });
    const res = await GET(getRequest("/api/kudos?limit=3"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: { id: string }[];
      nextCursor: string | null;
    };
    expect(body.items.map((k) => k.id)).toEqual([
      seed.kudoNewest,
      seed.kudoBetaOnly,
      seed.kudoMid2,
    ]);
    expect(body.nextCursor).not.toBeNull();
  });
});
