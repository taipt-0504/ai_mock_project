import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/src/lib/prisma";
import { userRepository } from "@/src/repositories/user-repository";
import { clearAuthTables, createTestUser } from "@/tests/fixtures/users";

describe("userRepository.updateLocale (integration — real DB)", () => {
  beforeEach(async () => {
    await clearAuthTables();
  });

  afterAll(async () => {
    await clearAuthTables();
    await prisma.$disconnect();
  });

  it("updates User.locale to the given supported locale", async () => {
    const user = await createTestUser({ locale: "vi-VN" });
    await userRepository.updateLocale(user.id, "en-US");
    const reloaded = await prisma.user.findUnique({ where: { id: user.id } });
    expect(reloaded?.locale).toBe("en-US");
  });

  it("is idempotent — repeating with the same locale leaves the row unchanged", async () => {
    const user = await createTestUser({ locale: "en-US" });
    await userRepository.updateLocale(user.id, "en-US");
    await userRepository.updateLocale(user.id, "en-US");
    const reloaded = await prisma.user.findUnique({ where: { id: user.id } });
    expect(reloaded?.locale).toBe("en-US");
  });

  it("rejects when the user ID does not exist (Prisma P2025)", async () => {
    await expect(
      userRepository.updateLocale("ghost-user-id", "en-US"),
    ).rejects.toThrow();
  });
});
