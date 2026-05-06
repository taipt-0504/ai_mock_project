import { PrismaAdapter } from "@auth/prisma-adapter";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/src/lib/prisma";
import { clearAuthTables } from "@/tests/fixtures/users";

/**
 * T035 — adapter-level happy-path integration test.
 *
 * Originally scoped as "use buildAuthConfig({ providers: [Credentials] })
 * to exercise the full sign-in flow". The HTTP layer is unreachable from
 * Vitest 4 (next-auth's precompiled output ships bare `next/server`
 * imports that Vitest's resolver can't follow). This test instead drives
 * the **Prisma adapter directly** — the same code path Auth.js invokes
 * under the hood — which validates every DB write the OAuth callback
 * relies on:
 *
 *   - User row creation
 *   - Account row linking (the Google OAuth identity)
 *   - Session row creation + sessionToken indexing
 *   - getSessionAndUser round-trip (what `auth()` calls on every request)
 *
 * The cookie-creation half of the original scope is covered end-to-end
 * by the Playwright sign-in spec (T051).
 */
describe("Auth.js Prisma adapter — happy path (T035)", () => {
  const adapter = PrismaAdapter(prisma);
  const NOW = new Date();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  beforeEach(async () => {
    await clearAuthTables();
  });

  afterAll(async () => {
    await clearAuthTables();
    await prisma.$disconnect();
  });

  async function seedUser() {
    const user = await adapter.createUser!({
      id: "happy-user-1",
      email: "happy@example.com",
      emailVerified: null,
      name: "Happy Path",
      image: null,
    });
    return user;
  }

  it("createUser → User row materialized with the supplied fields", async () => {
    const created = await seedUser();
    expect(created.email).toBe("happy@example.com");

    const reloaded = await prisma.user.findUnique({ where: { id: created.id } });
    expect(reloaded).not.toBeNull();
    expect(reloaded?.email).toBe("happy@example.com");
    // Constitution-mandated default — every new User starts in vi-VN.
    expect(reloaded?.locale).toBe("vi-VN");
  });

  it("linkAccount → Account row links the Google identity to the user", async () => {
    const user = await seedUser();
    await adapter.linkAccount!({
      userId: user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: "google-uid-12345",
      access_token: "ya29.synthetic-token-not-real",
      token_type: "bearer",
      expires_at: Math.floor((Date.now() + 3600_000) / 1000),
      scope: "openid email profile",
    });

    const linked = await prisma.account.findFirst({
      where: { userId: user.id, provider: "google" },
    });
    expect(linked).not.toBeNull();
    expect(linked?.providerAccountId).toBe("google-uid-12345");
  });

  it("getUserByAccount → resolves the user from a linked Google identity (return-visit lookup)", async () => {
    const user = await seedUser();
    await adapter.linkAccount!({
      userId: user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: "google-uid-67890",
    });

    const found = await adapter.getUserByAccount!({
      provider: "google",
      providerAccountId: "google-uid-67890",
    });
    expect(found?.id).toBe(user.id);
  });

  it("createSession → Session row materialized with the supplied token + 30-day expiry", async () => {
    const user = await seedUser();
    const expires = new Date(NOW.getTime() + THIRTY_DAYS_MS);
    await adapter.createSession!({
      sessionToken: "happy-session-token-1",
      userId: user.id,
      expires,
    });

    const reloaded = await prisma.session.findUnique({
      where: { sessionToken: "happy-session-token-1" },
    });
    expect(reloaded?.userId).toBe(user.id);
    expect(reloaded?.expires.getTime()).toBe(expires.getTime());
  });

  it("getSessionAndUser → joined session + user round-trip (the request-time `auth()` lookup)", async () => {
    const user = await seedUser();
    await adapter.linkAccount!({
      userId: user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: "google-uid-roundtrip",
    });
    await adapter.createSession!({
      sessionToken: "round-trip-token",
      userId: user.id,
      expires: new Date(NOW.getTime() + THIRTY_DAYS_MS),
    });

    const result = await adapter.getSessionAndUser!("round-trip-token");
    expect(result).not.toBeNull();
    expect(result?.user.id).toBe(user.id);
    expect(result?.session.userId).toBe(user.id);
  });

  it("getSessionAndUser returns null for an unknown sessionToken (no leak across users)", async () => {
    const result = await adapter.getSessionAndUser!("does-not-exist");
    expect(result).toBeNull();
  });
});
