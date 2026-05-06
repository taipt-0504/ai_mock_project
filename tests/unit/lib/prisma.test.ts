import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The singleton's contract (T017):
 *  1. The very first import in a non-prod process instantiates a `PrismaClient`
 *     and parks it on `globalThis.__saaPrisma` so Next.js HMR re-evaluation
 *     reuses the same client instead of leaking connections.
 *  2. If `globalThis.__saaPrisma` already exists, the module reuses it
 *     (the HMR-reuse path).
 *  3. In production we do NOT cache on globalThis — each module instance
 *     constructs its own client (no HMR there).
 */

const prismaCtor = vi.fn();
const configState = { NODE_ENV: "test" as "test" | "development" | "production" };

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(function (this: object) {
    prismaCtor();
    Object.assign(this, { __isStub: true });
  }),
}));

vi.mock("@/src/lib/config", () => ({
  config: configState,
}));

describe("prisma singleton", () => {
  beforeEach(() => {
    delete (globalThis as { __saaPrisma?: unknown }).__saaPrisma;
    prismaCtor.mockReset();
    vi.resetModules();
    configState.NODE_ENV = "test";
  });

  afterEach(() => {
    delete (globalThis as { __saaPrisma?: unknown }).__saaPrisma;
  });

  it("constructs PrismaClient once and parks it on globalThis (non-production)", async () => {
    const m = await import("@/src/lib/prisma");
    expect(prismaCtor).toHaveBeenCalledTimes(1);
    expect((globalThis as { __saaPrisma?: unknown }).__saaPrisma).toBe(m.prisma);
  });

  it("reuses an existing globalThis.__saaPrisma instance (HMR re-evaluation)", async () => {
    const stub = { __preexisting: true };
    (globalThis as { __saaPrisma?: unknown }).__saaPrisma = stub;
    const m = await import("@/src/lib/prisma");
    expect(prismaCtor).not.toHaveBeenCalled();
    expect(m.prisma).toBe(stub);
  });

  it("returns the same instance across repeated imports in one process", async () => {
    const m1 = await import("@/src/lib/prisma");
    const m2 = await import("@/src/lib/prisma");
    expect(m1.prisma).toBe(m2.prisma);
    expect(prismaCtor).toHaveBeenCalledTimes(1);
  });

  it("does NOT park the client on globalThis when NODE_ENV is production", async () => {
    configState.NODE_ENV = "production";
    await import("@/src/lib/prisma");
    expect(prismaCtor).toHaveBeenCalledTimes(1);
    expect((globalThis as { __saaPrisma?: unknown }).__saaPrisma).toBeUndefined();
  });
});
