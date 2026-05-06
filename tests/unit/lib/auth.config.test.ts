import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/prisma", () => ({
  prisma: {} as unknown,
}));

const loggerCalls: Array<{ level: string; event: string; payload?: unknown }> = [];
vi.mock("@/src/lib/logger", () => ({
  logger: {
    info: (event: string, payload?: unknown) =>
      loggerCalls.push({ level: "info", event, payload }),
    warn: (event: string, payload?: unknown) =>
      loggerCalls.push({ level: "warn", event, payload }),
    error: (event: string, payload?: unknown) =>
      loggerCalls.push({ level: "error", event, payload }),
  },
}));

import { buildAuthConfig } from "@/src/lib/auth.config";

const baseParams = {
  providers: [],
  secret: "test-secret-256bits-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  trustHost: false,
};

describe("buildAuthConfig", () => {
  beforeEach(() => {
    loggerCalls.length = 0;
  });

  it("uses database session strategy with a 30-day max age (TR-003)", () => {
    const cfg = buildAuthConfig(baseParams);
    expect(cfg.session?.strategy).toBe("database");
    expect(cfg.session?.maxAge).toBe(60 * 60 * 24 * 30);
  });

  it("attaches the Prisma adapter and forwards secret + trustHost params", () => {
    const cfg = buildAuthConfig({ ...baseParams, trustHost: true });
    expect(cfg.adapter).toBeDefined();
    expect(cfg.secret).toBe(baseParams.secret);
    expect(cfg.trustHost).toBe(true);
  });

  it("forwards the providers array untouched", () => {
    const stubProvider = { id: "google", name: "Google" } as never;
    const cfg = buildAuthConfig({ ...baseParams, providers: [stubProvider] });
    expect(cfg.providers).toEqual([stubProvider]);
  });

  it("registers the four lifecycle event hooks (signIn / signOut / linkAccount / createUser)", () => {
    const cfg = buildAuthConfig(baseParams);
    expect(typeof cfg.events?.signIn).toBe("function");
    expect(typeof cfg.events?.signOut).toBe("function");
    expect(typeof cfg.events?.linkAccount).toBe("function");
    expect(typeof cfg.events?.createUser).toBe("function");
  });

  it("logs auth.signin with userId + isNewUser", () => {
    const cfg = buildAuthConfig(baseParams);
    cfg.events?.signIn?.({
      user: { id: "u1" },
      isNewUser: true,
    } as Parameters<NonNullable<NonNullable<typeof cfg.events>["signIn"]>>[0]);
    expect(loggerCalls).toContainEqual({
      level: "info",
      event: "auth.signin",
      payload: { userId: "u1", isNewUser: true },
    });
  });

  it("emits auth.signin.duration with provider + completed_at on every signIn (T073)", () => {
    const cfg = buildAuthConfig(baseParams);
    cfg.events?.signIn?.({
      user: { id: "u1" },
      isNewUser: false,
      account: { provider: "google" },
    } as Parameters<NonNullable<NonNullable<typeof cfg.events>["signIn"]>>[0]);
    const duration = loggerCalls.find((c) => c.event === "auth.signin.duration");
    expect(duration).toBeDefined();
    expect(duration?.payload).toMatchObject({
      provider: "google",
      duration_ms: null,
    });
    expect((duration?.payload as { completed_at?: string }).completed_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T/,
    );
  });

  it("auth.signin.duration falls back to provider='unknown' when account is absent", () => {
    const cfg = buildAuthConfig(baseParams);
    cfg.events?.signIn?.({
      user: { id: "u-no-account" },
      isNewUser: false,
    } as Parameters<NonNullable<NonNullable<typeof cfg.events>["signIn"]>>[0]);
    const duration = loggerCalls.find((c) => c.event === "auth.signin.duration");
    expect((duration?.payload as { provider?: string }).provider).toBe("unknown");
  });

  it("logs auth.signout from a session-shaped message", () => {
    const cfg = buildAuthConfig(baseParams);
    cfg.events?.signOut?.({
      session: { userId: "u2" },
    } as Parameters<NonNullable<NonNullable<typeof cfg.events>["signOut"]>>[0]);
    expect(loggerCalls).toContainEqual({
      level: "info",
      event: "auth.signout",
      payload: { userId: "u2" },
    });
  });

  it("logs auth.linkAccount with userId + provider", () => {
    const cfg = buildAuthConfig(baseParams);
    cfg.events?.linkAccount?.({
      user: { id: "u3" },
      account: { provider: "google" },
    } as Parameters<NonNullable<NonNullable<typeof cfg.events>["linkAccount"]>>[0]);
    expect(loggerCalls).toContainEqual({
      level: "info",
      event: "auth.linkAccount",
      payload: { userId: "u3", provider: "google" },
    });
  });

  it("logs auth.createUser with userId", () => {
    const cfg = buildAuthConfig(baseParams);
    cfg.events?.createUser?.({
      user: { id: "u4" },
    } as Parameters<NonNullable<NonNullable<typeof cfg.events>["createUser"]>>[0]);
    expect(loggerCalls).toContainEqual({
      level: "info",
      event: "auth.createUser",
      payload: { userId: "u4" },
    });
  });

  it("session callback enriches session.user with locale from the User row", () => {
    const cfg = buildAuthConfig(baseParams);
    const result = cfg.callbacks?.session?.({
      session: { user: { name: "x" }, expires: "2999-01-01" },
      user: { locale: "en-US" },
    } as unknown as Parameters<
      NonNullable<NonNullable<typeof cfg.callbacks>["session"]>
    >[0]);
    expect((result as { user?: { locale?: string } } | undefined)?.user?.locale).toBe(
      "en-US",
    );
  });

  it("session callback defaults to vi-VN when User.locale is absent", () => {
    const cfg = buildAuthConfig(baseParams);
    const result = cfg.callbacks?.session?.({
      session: { user: {}, expires: "2999-01-01" },
      user: {},
    } as unknown as Parameters<
      NonNullable<NonNullable<typeof cfg.callbacks>["session"]>
    >[0]);
    expect((result as { user?: { locale?: string } } | undefined)?.user?.locale).toBe(
      "vi-VN",
    );
  });
});
