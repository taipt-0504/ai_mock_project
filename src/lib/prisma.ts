import { PrismaClient } from "@prisma/client";

import { config } from "@/src/lib/config";

declare global {
   
  var __saaPrisma: PrismaClient | undefined;
}

/**
 * Singleton `PrismaClient`. The `globalThis` cache prevents Next.js HMR
 * from spawning multiple connections in development.
 */
export const prisma: PrismaClient =
  globalThis.__saaPrisma ??
  new PrismaClient({
    log: config.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (config.NODE_ENV !== "production") {
  globalThis.__saaPrisma = prisma;
}
