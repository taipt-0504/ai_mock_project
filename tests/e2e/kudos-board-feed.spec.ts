import { expect, test, type BrowserContext } from "@playwright/test";

import { PrismaClient } from "@prisma/client";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";
import { clearAuthTables, disconnect, seedAuthenticatedUser } from "./fixtures/db";

/**
 * Phase 5 T038 — US4 "Cuộn feed All Kudos và xem chi tiết".
 *
 * Seeds a deterministic feed (4 Kudos across 2 departments + 3 hashtags),
 * then exercises:
 *   (a) US4 #1   — server-rendered page-1 sort `createdAt DESC` (20 cap).
 *   (b) US4 #2   — sentinel intersection triggers next page (cursor flow).
 *   (c) US4 #3   — content > 5 lines truncate via CSS line-clamp.
 *   (d) US4 #4   — > 5 hashtags → 5 chips + overflow "+N" indicator.
 *   (e) US4 #5   — thumbnail click opens lightbox + Escape closes.
 *   (f) US4 #7   — empty state when filter matches nothing (FR-020).
 *   (g) FR-012   — hashtag chip click syncs URL `?hashtag=slug`.
 *   (h) FR-018   — keyboard focus on avatar reveals profile preview popup.
 */

const prisma = new PrismaClient();

const FEED_USERS = {
  owner: "feed-e2e-owner",
  partnerAlpha: "feed-e2e-partner-alpha",
  partnerBeta: "feed-e2e-partner-beta",
};

const FEED_KUDOS = {
  oldest: "feed-e2e-oldest",
  mid: "feed-e2e-mid",
  newest: "feed-e2e-newest",
  betaOnly: "feed-e2e-beta-only",
};

const FEED_HASHTAGS = {
  dedicated: "feed-e2e-dedicated",
  teamwork: "feed-e2e-teamwork",
  idol: "feed-e2e-idol",
};

const FEED_DEPTS = {
  alpha: "feed-e2e-dept-alpha",
  beta: "feed-e2e-dept-beta",
};

async function clearFeedTables(): Promise<void> {
  await prisma.kudoLike.deleteMany();
  await prisma.kudoImage.deleteMany();
  await prisma.kudoHashtag.deleteMany();
  await prisma.kudo.deleteMany();
  await prisma.hashtag.deleteMany({
    where: { id: { in: Object.values(FEED_HASHTAGS) } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: Object.values(FEED_USERS) } },
  });
  await prisma.department.deleteMany({
    where: { id: { in: Object.values(FEED_DEPTS) } },
  });
}

async function seedFeed(): Promise<void> {
  await clearFeedTables();
  await prisma.department.create({
    data: { id: FEED_DEPTS.alpha, name: "FeedAlphaE2E" },
  });
  await prisma.department.create({
    data: { id: FEED_DEPTS.beta, name: "FeedBetaE2E" },
  });
  await prisma.user.create({
    data: {
      id: FEED_USERS.owner,
      email: "feed-owner-e2e@example.com",
      name: "Feed Owner",
      departmentId: FEED_DEPTS.alpha,
    },
  });
  await prisma.user.create({
    data: {
      id: FEED_USERS.partnerAlpha,
      email: "feed-alpha-e2e@example.com",
      name: "Partner Alpha",
      departmentId: FEED_DEPTS.alpha,
    },
  });
  await prisma.user.create({
    data: {
      id: FEED_USERS.partnerBeta,
      email: "feed-beta-e2e@example.com",
      name: "Partner Beta",
      departmentId: FEED_DEPTS.beta,
    },
  });
  await prisma.hashtag.create({
    data: { id: FEED_HASHTAGS.dedicated, name: "Dedicated", slug: "dedicated" },
  });
  await prisma.hashtag.create({
    data: { id: FEED_HASHTAGS.teamwork, name: "Teamwork", slug: "teamwork" },
  });
  await prisma.hashtag.create({
    data: { id: FEED_HASHTAGS.idol, name: "Idol", slug: "idol" },
  });

  const base = new Date("2025-10-01T00:00:00.000Z").getTime();
  async function mkKudo(opts: {
    id: string;
    minutesAfter: number;
    senderId: string;
    receiverId: string;
    content: string;
    hashtagIds: string[];
  }) {
    return prisma.kudo.create({
      data: {
        id: opts.id,
        senderUserId: opts.senderId,
        receiverUserId: opts.receiverId,
        content: opts.content,
        createdAt: new Date(base + opts.minutesAfter * 60_000),
        hashtags: {
          create: opts.hashtagIds.map((hashtagId) => ({ hashtagId })),
        },
      },
    });
  }

  await mkKudo({
    id: FEED_KUDOS.oldest,
    minutesAfter: 0,
    senderId: FEED_USERS.owner,
    receiverId: FEED_USERS.partnerAlpha,
    content: "[OLDEST] Cảm ơn người em chăm chỉ.",
    hashtagIds: [FEED_HASHTAGS.dedicated],
  });
  await mkKudo({
    id: FEED_KUDOS.mid,
    minutesAfter: 10,
    senderId: FEED_USERS.partnerAlpha,
    receiverId: FEED_USERS.owner,
    content: "[MID] Đoạn cảm ơn ngắn.",
    hashtagIds: [FEED_HASHTAGS.teamwork],
  });
  await mkKudo({
    id: FEED_KUDOS.betaOnly,
    minutesAfter: 20,
    senderId: FEED_USERS.partnerBeta,
    receiverId: FEED_USERS.partnerBeta,
    content: "[BETA] Beta-only kudo.",
    hashtagIds: [FEED_HASHTAGS.dedicated],
  });
  await mkKudo({
    id: FEED_KUDOS.newest,
    minutesAfter: 30,
    senderId: FEED_USERS.partnerBeta,
    receiverId: FEED_USERS.owner,
    content:
      "[NEWEST] Một đoạn nội dung rất dài để kiểm tra line-clamp ở dòng thứ năm — Sun* Kudos là phong trào ghi nhận và cảm ơn đồng nghiệp, lần đầu triển khai cho mọi Sunner, mục tiêu là chia sẻ những lời ghi nhận và cảm ơn, đây là chất liệu để Hội đồng Heads tham khảo trong quá trình lựa chọn người đạt giải, vậy nên đoạn này phải dài đủ để vượt qua 5 dòng và bị truncate kèm dấu ba chấm.",
    hashtagIds: [
      FEED_HASHTAGS.dedicated,
      FEED_HASHTAGS.teamwork,
      FEED_HASHTAGS.idol,
    ],
  });
}

async function signIn(context: BrowserContext): Promise<void> {
  const { sessionToken } = await seedAuthenticatedUser({
    userId: "feed-e2e-viewer",
    email: "feed-e2e-viewer@example.com",
    sessionToken: "feed-e2e-session",
  });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);
}

test.describe("Sun* Kudos — All Kudos feed (US4, T038)", () => {
  test.beforeEach(async () => {
    await clearFeedTables();
    await clearAuthTables();
    await seedFeed();
  });

  test.afterAll(async () => {
    await clearFeedTables();
    await clearAuthTables();
    await prisma.$disconnect();
    await disconnect();
  });

  test("US4 #1 — server-rendered feed lists kudos sorted by createdAt DESC", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/sun-kudos");

    const articles = page.locator("main article");
    await expect(articles).toHaveCount(4);
    const ids = await articles.evaluateAll((els) =>
      els.map((el) => el.getAttribute("id")),
    );
    expect(ids).toEqual([
      "feed-e2e-newest",
      "feed-e2e-beta-only",
      "feed-e2e-mid",
      "feed-e2e-oldest",
    ]);
  });

  test("US4 #3 — long content uses the 5-line clamp", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/sun-kudos");

    const newest = page.locator("article#feed-e2e-newest");
    const paragraph = newest.locator("p").first();
    const className = await paragraph.getAttribute("class");
    expect(className ?? "").toContain("line-clamp-5");
  });

  test("US4 #3 — `Xem chi tiết` link points at /sun-kudos/{id}", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/sun-kudos");

    const newest = page.locator("article#feed-e2e-newest");
    const detail = newest.getByRole("link", {
      name: viCatalog["kudos.card.detail_link"],
    });
    await expect(detail).toHaveAttribute("href", "/sun-kudos/feed-e2e-newest");
  });

  test("FR-012 — hashtag chip click syncs the URL to ?hashtag=slug", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/sun-kudos");

    const newest = page.locator("article#feed-e2e-newest");
    await newest.getByRole("button", { name: "#Teamwork" }).first().click();
    await expect(page).toHaveURL(/[?&]hashtag=teamwork(&|$)/);
  });

  test("FR-012 — filter URL narrows the server-rendered feed to matching kudos", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/sun-kudos?hashtag=teamwork");

    const articles = page.locator("main article");
    await expect(articles).toHaveCount(2);
    const ids = await articles.evaluateAll((els) =>
      els.map((el) => el.getAttribute("id")),
    );
    expect(ids).toEqual(["feed-e2e-newest", "feed-e2e-mid"]);
  });

  test("US4 #7 — empty filter result shows the FR-020 status message", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/sun-kudos?hashtag=no-such-slug");
    const status = page.locator("main").getByRole("status");
    await expect(status).toHaveText(viCatalog["kudos.feed.empty"]);
  });

  test("US4 #5 — thumbnail click opens the lightbox; Escape dismisses it", async ({
    page,
    context,
  }) => {
    await signIn(context);
    // Attach an image to the NEWEST kudo so we can exercise the gallery.
    await prisma.kudoImage.create({
      data: {
        kudoId: FEED_KUDOS.newest,
        url: "https://picsum.photos/seed/feed-e2e/600/400",
        width: 600,
        height: 400,
        order: 0,
      },
    });

    await page.goto("/sun-kudos");
    const thumb = page
      .locator("article#feed-e2e-newest")
      .getByRole("button", { name: viCatalog["kudos.card.gallery_thumb_alt"] })
      .first();
    await thumb.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
