import { prisma } from "@/src/lib/prisma";
import type { SupportedLocale } from "@/src/lib/i18n/types";

/**
 * User persistence boundary. Per the plan, the repository is the ONLY layer
 * that calls Prisma — services and route handlers must go through it. No
 * business logic here; just typed CRUD.
 */
export const userRepository = {
  async updateLocale(userId: string, locale: SupportedLocale): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { locale },
    });
  },
};
