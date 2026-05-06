import type { Account, Session, User } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

const TEST_USER_DEFAULTS = {
  id: "test-user-1",
  name: "Test User",
  email: "test.user@example.com",
  emailVerified: null,
  image: null,
  locale: "vi-VN",
} as const satisfies Partial<User>;

/** Inserts a deterministic User row. Idempotent via `upsert`. */
export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const data = { ...TEST_USER_DEFAULTS, ...overrides };
  return prisma.user.upsert({
    where: { id: data.id },
    create: data,
    update: data,
  });
}

/** Inserts a Google `Account` row linked to the given user. */
export async function createTestAccount(
  userId: string,
  overrides: Partial<Account> = {},
): Promise<Account> {
  return prisma.account.create({
    data: {
      userId,
      type: "oauth",
      provider: "google",
      providerAccountId: `google-test-${userId}`,
      ...overrides,
    },
  });
}

/** Inserts a Session row valid for 30 days. */
export async function createTestSession(
  userId: string,
  overrides: Partial<Session> = {},
): Promise<Session> {
  return prisma.session.create({
    data: {
      sessionToken: `test-session-token-${userId}`,
      userId,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides,
    },
  });
}

/** Wipes the auth tables in dependency-safe order. Use between tests in a file. */
export async function clearAuthTables(): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}
