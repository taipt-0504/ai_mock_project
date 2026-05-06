import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("config", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("exposes parsed NODE_ENV with default 'development'", async () => {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    const { config } = await import("@/src/lib/config");
    expect(config.NODE_ENV).toBe("development");
  });

  it("AUTH_TRUST_HOST coerces string flags to boolean", async () => {
    process.env.AUTH_TRUST_HOST = "true";
    const { config } = await import("@/src/lib/config");
    expect(config.AUTH_TRUST_HOST).toBe(true);
  });

  it("AUTH_TRUST_HOST defaults to false when unset", async () => {
    delete process.env.AUTH_TRUST_HOST;
    const { config } = await import("@/src/lib/config");
    expect(config.AUTH_TRUST_HOST).toBe(false);
  });

  it("DATABASE_URL getter returns the value when set", async () => {
    process.env.DATABASE_URL = "postgresql://localhost/saa";
    const { config } = await import("@/src/lib/config");
    expect(config.DATABASE_URL).toBe("postgresql://localhost/saa");
  });

  it("DATABASE_URL getter throws when missing (lazy required)", async () => {
    delete process.env.DATABASE_URL;
    const { config } = await import("@/src/lib/config");
    expect(() => config.DATABASE_URL).toThrow(/DATABASE_URL/);
  });

  it("AUTH_SECRET getter throws when missing — closes the gap before runtime use", async () => {
    delete process.env.AUTH_SECRET;
    const { config } = await import("@/src/lib/config");
    expect(() => config.AUTH_SECRET).toThrow(/AUTH_SECRET/);
  });
});
