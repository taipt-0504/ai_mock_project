import { PrismaClient } from "@prisma/client";

/**
 * E2E DB helpers. Drive the SAME PostgreSQL instance the dev server reads
 * from — i.e. the value of `DATABASE_URL` in the env when Playwright was
 * launched. Run E2E with `DATABASE_URL=$DATABASE_URL_TEST npm run test:e2e`
 * to keep seeded data out of the developer's working DB.
 *
 * Each helper is idempotent: tests should `clearAuthTables()` in `beforeEach`
 * to start from a known state.
 */

const prisma = new PrismaClient();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function clearAuthTables(): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedAuthenticatedUser(opts?: {
  userId?: string;
  email?: string;
  locale?: "vi-VN" | "en-US";
  sessionToken?: string;
}): Promise<{
  userId: string;
  sessionToken: string;
  expires: Date;
}> {
  const userId = opts?.userId ?? "e2e-user-1";
  const email = opts?.email ?? "e2e@example.com";
  const locale = opts?.locale ?? "vi-VN";
  const sessionToken = opts?.sessionToken ?? "e2e-session-token-1";

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name: "E2E User", locale },
    update: { email, locale },
  });
  const expires = new Date(Date.now() + THIRTY_DAYS_MS);
  await prisma.session.upsert({
    where: { sessionToken },
    create: { sessionToken, userId, expires },
    update: { userId, expires },
  });
  return { userId, sessionToken, expires };
}

export async function getUserLocale(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.locale ?? null;
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
