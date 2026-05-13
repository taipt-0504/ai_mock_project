import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));
vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import { POST } from "@/app/api/kudos/route";
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
