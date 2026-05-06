import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";

import { logger } from "@/src/lib/logger";
import { prisma } from "@/src/lib/prisma";

/**
 * Auth.js (NextAuth v5) configuration factory. Splitting the config from
 * the instantiation lets tests construct a TEST instance with stub
 * providers (Constitution Principle V — TDD) without mocking module loads.
 *
 * Secrets / trust-host flags are passed in by the caller so this module
 * stays env-agnostic — the production wrapper at `src/lib/auth.ts` reads
 * them from `config`, while tests can pass deterministic values.
 *
 * Database-session strategy is mandated by Constitution v1.1.1 and Login
 * spec TR-003 — Auth.js writes Session rows via the Prisma adapter.
 */
export function buildAuthConfig({
  providers,
  secret,
  trustHost,
}: {
  providers: NextAuthConfig["providers"];
  secret: string;
  trustHost: boolean;
}): NextAuthConfig {
  return {
    adapter: PrismaAdapter(prisma),
    providers,
    session: {
      strategy: "database",
      maxAge: 60 * 60 * 24 * 30,
    },
    secret,
    trustHost,
    events: {
      signIn: ({ user, account, isNewUser }) => {
        logger.info("auth.signin", { userId: user?.id, isNewUser });
        // T073 — duration metric for SC-001 (B.3 click → session creation).
        // Client-side click timestamp threading isn't yet wired (would need
        // to ride the OAuth `state` param), so `duration_ms` is null for
        // now; dashboards correlate via `request_id` from the middleware.
        // Emitted regardless so the metric pipeline exists end-to-end.
        logger.info("auth.signin.duration", {
          provider: account?.provider ?? "unknown",
          duration_ms: null,
          completed_at: new Date().toISOString(),
        });
      },
      signOut: (message) => {
        const userId =
          "session" in message
            ? message.session?.userId
            : "token" in message
              ? message.token?.sub
              : undefined;
        logger.info("auth.signout", { userId });
      },
      linkAccount: ({ user, account }) => {
        logger.info("auth.linkAccount", { userId: user.id, provider: account.provider });
      },
      createUser: ({ user }) => {
        logger.info("auth.createUser", { userId: user.id });
      },
    },
    callbacks: {
      session: ({ session, user }) => {
        // Enrich the session object with the authenticated user's locale so
        // downstream Server Components don't need a second DB read for it.
        if (session.user && user) {
          (session.user as typeof session.user & { locale?: string }).locale =
            (user as { locale?: string }).locale ?? "vi-VN";
        }
        return session;
      },
    },
  };
}
