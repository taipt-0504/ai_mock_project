/**
 * Idempotent seed script for the Sun* Kudos Live Board (Phase 2 of plan
 * `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board`).
 *
 * Strategy:
 * - Taxonomies (Department, Hashtag, Gift) — upsert by their unique column.
 * - SpecialDay — two rows: today (Asia/Ho_Chi_Minh) + 7 days ago. Upsert by
 *   `date`. Substitutes the admin-CRUD endpoint deferred under Q-PLAN2.
 * - Seed users — five rows with stable IDs `seed-user-1`..`seed-user-5`,
 *   upserted by `email`. These coexist with Auth.js-provisioned users (which
 *   get cuid IDs) so the seed never collides with real Google logins.
 * - Kudos / KudoLikes / SecretBoxes — generated deterministically from the
 *   seed users with stable IDs, upserted in batches.
 * - Counters — re-derived from ground truth (Kudo + KudoLike rows) AFTER the
 *   rows exist, so denormalized fields are always consistent with the source
 *   of truth on every run.
 *
 * Re-runs are safe: every Prisma operation is upsert-by-stable-key.
 */
import { PrismaClient, SecretBoxState } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_USER_COUNT = 5;
const SEED_KUDO_COUNT = 50;
const TARGET_LIKE_COUNT = 150;

const DEPARTMENTS = [
  "Marketing",
  "Engineering",
  "Design",
  "HR",
  "Operations",
] as const;

const HASHTAGS = [
  { name: "Dedicated", slug: "dedicated" },
  { name: "Inspiring", slug: "inspiring" },
  { name: "IDOL GIỚI TRẺ", slug: "idol-gioi-tre" },
  { name: "Teamwork", slug: "teamwork" },
  { name: "Innovation", slug: "innovation" },
  { name: "Leadership", slug: "leadership" },
  { name: "Creativity", slug: "creativity" },
  { name: "Reliable", slug: "reliable" },
  { name: "Mentor", slug: "mentor" },
  { name: "Problem Solver", slug: "problem-solver" },
  { name: "Customer Focus", slug: "customer-focus" },
  { name: "Above and Beyond", slug: "above-and-beyond" },
  { name: "Cross Functional", slug: "cross-functional" },
  { name: "Quality", slug: "quality" },
  { name: "Positive Energy", slug: "positive-energy" },
] as const;

const GIFTS = [
  { name: "Sun* Mug" },
  { name: "Notebook" },
  { name: "Tote Bag" },
  { name: "Sticker Pack" },
  { name: "Coffee Voucher" },
] as const;

const USER_TITLES = [
  "Senior Engineer",
  "Product Designer",
  "Marketing Lead",
  "People Partner",
  "Operations Manager",
];

function dateInIctToday(): Date {
  // YYYY-MM-DD of the current moment as seen in Asia/Ho_Chi_Minh, then UTC
  // midnight so Prisma's `@db.Date` lands on the correct day regardless of
  // the server's wall clock.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return new Date(`${fmt.format(new Date())}T00:00:00.000Z`);
}

function daysAgoUtc(base: Date, days: number): Date {
  return new Date(base.getTime() - days * 24 * 60 * 60 * 1000);
}

async function seedDepartments(): Promise<string[]> {
  const ids: string[] = [];
  for (const name of DEPARTMENTS) {
    const row = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    ids.push(row.id);
  }
  return ids;
}

async function seedHashtags(): Promise<string[]> {
  const ids: string[] = [];
  for (const tag of HASHTAGS) {
    const row = await prisma.hashtag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
    ids.push(row.id);
  }
  return ids;
}

async function seedGifts(): Promise<string[]> {
  const ids: string[] = [];
  for (const gift of GIFTS) {
    const row = await prisma.gift.upsert({
      where: { id: `seed-gift-${gift.name.toLowerCase().replace(/\W+/g, "-")}` },
      update: { name: gift.name },
      create: {
        id: `seed-gift-${gift.name.toLowerCase().replace(/\W+/g, "-")}`,
        name: gift.name,
      },
    });
    ids.push(row.id);
  }
  return ids;
}

async function seedSpecialDays(): Promise<void> {
  const today = dateInIctToday();
  const aWeekAgo = daysAgoUtc(today, 7);
  for (const [date, label] of [
    [today, "Special Day — today"],
    [aWeekAgo, "Special Day — last week"],
  ] as const) {
    await prisma.specialDay.upsert({
      where: { date },
      update: { label, multiplier: 2 },
      create: { date, label, multiplier: 2 },
    });
  }
}

async function seedUsers(deptIds: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < SEED_USER_COUNT; i += 1) {
    const id = `seed-user-${i + 1}`;
    const email = `seed-user-${i + 1}@kudos.local`;
    const departmentId = deptIds[i % deptIds.length];
    const row = await prisma.user.upsert({
      where: { email },
      update: {
        name: `Seed Sunner ${i + 1}`,
        departmentId,
        title: USER_TITLES[i % USER_TITLES.length],
      },
      create: {
        id,
        email,
        name: `Seed Sunner ${i + 1}`,
        departmentId,
        title: USER_TITLES[i % USER_TITLES.length],
      },
    });
    ids.push(row.id);
  }
  return ids;
}

async function seedKudos(
  userIds: string[],
  hashtagIds: string[],
): Promise<string[]> {
  const today = new Date();
  const ids: string[] = [];

  for (let i = 0; i < SEED_KUDO_COUNT; i += 1) {
    const id = `seed-kudo-${i}`;
    const senderIdx = i % userIds.length;
    const receiverIdx = (i + 1) % userIds.length;
    const senderUserId = userIds[senderIdx];
    const receiverUserId = userIds[receiverIdx];
    const createdAt = daysAgoUtc(today, SEED_KUDO_COUNT - i);

    const content =
      `Seed Kudo #${i + 1}: cảm ơn bạn vì sự đóng góp tuyệt vời ` +
      `trên dự án tuần qua. Đây là dòng nội dung mẫu được tạo bởi seed ` +
      `script để hỗ trợ phát triển Live Board.`;

    await prisma.kudo.upsert({
      where: { id },
      update: {
        senderUserId,
        receiverUserId,
        content,
        createdAt,
      },
      create: {
        id,
        senderUserId,
        receiverUserId,
        content,
        createdAt,
      },
    });

    // 0..2 hashtags per kudo, deterministic.
    const tagCount = (i % 3) + 1;
    for (let t = 0; t < tagCount; t += 1) {
      const hashtagId = hashtagIds[(i + t) % hashtagIds.length];
      await prisma.kudoHashtag.upsert({
        where: { kudoId_hashtagId: { kudoId: id, hashtagId } },
        update: {},
        create: { kudoId: id, hashtagId },
      });
    }

    // 0..2 gallery images per kudo via picsum placeholders.
    const imageCount = i % 3;
    for (let img = 0; img < imageCount; img += 1) {
      const imageId = `seed-kudo-${i}-img-${img}`;
      await prisma.kudoImage.upsert({
        where: { id: imageId },
        update: {},
        create: {
          id: imageId,
          kudoId: id,
          url: `https://picsum.photos/seed/kudo-${i}-${img}/600/400`,
          width: 600,
          height: 400,
          order: img,
        },
      });
    }

    ids.push(id);
  }

  return ids;
}

async function seedKudoLikes(
  kudoIds: string[],
  userIds: string[],
): Promise<void> {
  const todayIct = dateInIctToday();
  let likeCounter = 0;

  for (let i = 0; i < kudoIds.length && likeCounter < TARGET_LIKE_COUNT; i += 1) {
    const kudoId = kudoIds[i];
    const senderIdx = i % userIds.length;
    // Each Kudo gets (i % 5) + 1 likes from the non-sender users so heartCount
    // ranges 1..5 — gives Highlight (top 5 by heartCount) deterministic data.
    const likeCount = (i % userIds.length) + 1;
    const likers = userIds.filter((_, idx) => idx !== senderIdx).slice(0, likeCount);

    for (const likerUserId of likers) {
      if (likeCounter >= TARGET_LIKE_COUNT) break;
      const likeId = `seed-like-${likeCounter}`;
      // Mark every 7th like as a special-day like for SpecialDay coverage.
      const isSpecialDayLike = likeCounter % 7 === 0;
      const createdAt = isSpecialDayLike ? todayIct : daysAgoUtc(new Date(), kudoIds.length - i);

      await prisma.kudoLike.upsert({
        where: { kudoId_userId: { kudoId, userId: likerUserId } },
        update: { isSpecialDayLike, createdAt },
        create: {
          id: likeId,
          kudoId,
          userId: likerUserId,
          isSpecialDayLike,
          createdAt,
        },
      });
      likeCounter += 1;
    }
  }
}

async function seedSecretBoxes(
  userIds: string[],
  giftIds: string[],
): Promise<void> {
  // Each seed user: 3 pending + 1 opened box, deterministic IDs.
  for (let userIdx = 0; userIdx < userIds.length; userIdx += 1) {
    const userId = userIds[userIdx];
    for (let n = 0; n < 3; n += 1) {
      const id = `seed-box-${userIdx}-pending-${n}`;
      await prisma.secretBox.upsert({
        where: { id },
        update: { userId, state: SecretBoxState.pending, openedAt: null, giftId: null },
        create: { id, userId, state: SecretBoxState.pending },
      });
    }
    const openedId = `seed-box-${userIdx}-opened-0`;
    const giftId = giftIds[userIdx % giftIds.length];
    await prisma.secretBox.upsert({
      where: { id: openedId },
      update: { userId, state: SecretBoxState.opened, giftId },
      create: {
        id: openedId,
        userId,
        state: SecretBoxState.opened,
        giftId,
        openedAt: daysAgoUtc(new Date(), userIdx + 1),
      },
    });
  }
}

async function recomputeUserCounters(userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    const [sentCount, receivedRows, pendingBoxCount, openedBoxCount] =
      await Promise.all([
        prisma.kudo.count({ where: { senderUserId: userId } }),
        prisma.kudo.findMany({
          where: { receiverUserId: userId },
          select: { id: true, likes: { select: { isSpecialDayLike: true } } },
        }),
        prisma.secretBox.count({
          where: { userId, state: SecretBoxState.pending },
        }),
        prisma.secretBox.count({
          where: { userId, state: SecretBoxState.opened },
        }),
      ]);

    const heartsReceivedCount = receivedRows.reduce(
      (acc, kudo) =>
        acc +
        kudo.likes.reduce(
          (likeAcc, like) => likeAcc + (like.isSpecialDayLike ? 2 : 1),
          0,
        ),
      0,
    );
    const totalHeartLikes = receivedRows.reduce(
      (acc, kudo) => acc + kudo.likes.length,
      0,
    );
    // heartCount on Kudo = like rows count regardless of special-day flag.
    // Re-sync per-Kudo heartCount alongside user counters so the seed leaves
    // the DB internally consistent.
    for (const kudo of receivedRows) {
      await prisma.kudo.update({
        where: { id: kudo.id },
        data: { heartCount: kudo.likes.length },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        kudosSentCount: sentCount,
        kudosReceivedCount: receivedRows.length,
        heartsReceivedCount,
        secretBoxesPendingCount: pendingBoxCount,
        secretBoxesOpenedCount: openedBoxCount,
      },
    });
    // Silence unused var (linter): totalHeartLikes is the same as heartCount
    // sum across received Kudos; left as documentation of the invariant.
    void totalHeartLikes;
  }
}

async function main(): Promise<void> {
  const deptIds = await seedDepartments();
  const hashtagIds = await seedHashtags();
  const giftIds = await seedGifts();
  await seedSpecialDays();
  const userIds = await seedUsers(deptIds);
  const kudoIds = await seedKudos(userIds, hashtagIds);
  await seedKudoLikes(kudoIds, userIds);
  await seedSecretBoxes(userIds, giftIds);
  await recomputeUserCounters(userIds);
}

main()
  .catch((err) => {
    console.error("[prisma/seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
