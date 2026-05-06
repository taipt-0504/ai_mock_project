import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { buildAuthConfig } from "@/src/lib/auth.config";
import { config } from "@/src/lib/config";

// During `next build`'s page-data-collection phase, route handlers are
// imported (so this module is evaluated) but never invoked. Reading the
// strict lazy getters for AUTH_SECRET / AUTH_GOOGLE_* would throw and fail
// the build when `.env.local` is missing. Use placeholders at build time;
// the real values are required only at request time.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

const googleClientId = isBuildPhase ? "build-placeholder" : config.AUTH_GOOGLE_ID;
const googleClientSecret = isBuildPhase
  ? "build-placeholder"
  : config.AUTH_GOOGLE_SECRET;
const authSecret = isBuildPhase ? "build-placeholder-secret" : config.AUTH_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth(
  buildAuthConfig({
    providers: [
      Google({ clientId: googleClientId, clientSecret: googleClientSecret }),
    ],
    secret: authSecret,
    trustHost: config.AUTH_TRUST_HOST,
  }),
);
