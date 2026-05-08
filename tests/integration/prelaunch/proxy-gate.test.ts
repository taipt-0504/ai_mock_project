import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function requestFor(pathname: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: { "x-forwarded-for": "203.0.113.1", ...(headers ?? {}) },
  });
}

async function loadProxyWithEnv(value: string | undefined): Promise<typeof import("@/proxy")> {
  if (value === undefined) {
    delete process.env.SAA_LAUNCH_AT;
  } else {
    process.env.SAA_LAUNCH_AT = value;
  }
  vi.resetModules();
  return await import("@/proxy");
}

describe("proxy() — gate-active end-to-end (FR-006 / FR-007)", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("redirects '/' to /coming-soon (307) when SAA_LAUNCH_AT is in the future", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/"));

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("http://localhost/coming-soon");
  });

  it("passes the prelaunch path itself through unchanged so the screen can render (FR-001)", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/coming-soon"));

    expect(res.status).not.toBe(307);
    // NextResponse.next() returns a 200-equivalent passthrough. The exact
    // status varies by Next.js internal but it is NEVER a 307 redirect.
    expect(res.headers.get("Location")).toBeNull();
  });

  it("passes /_next/* infrastructure paths through (FR-007 whitelist)", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/_next/data/foo.json"));

    expect(res.status).not.toBe(307);
  });

  it("redirects every Auth.js path during gate-active (Q-PG4 — NOT whitelisted)", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");

    for (const path of [
      "/api/auth/session",
      "/api/auth/callback/google",
      "/api/auth/signin",
      "/api/auth/signout",
      "/api/auth/csrf",
    ]) {
      const res = proxy(requestFor(path));
      expect(res.status, `expected redirect on ${path}`).toBe(307);
      expect(res.headers.get("Location")).toBe("http://localhost/coming-soon");
    }
  });

  it("redirects application API paths (notifications, i18n) to /coming-soon", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");

    for (const path of ["/api/notifications/unread-count", "/api/i18n/locale"]) {
      const res = proxy(requestFor(path));
      expect(res.status, `expected redirect on ${path}`).toBe(307);
    }
  });

  it("is auth-agnostic — same outcome with a session cookie attached (FR-002)", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const withCookie = requestFor("/awards", {
      cookie: "authjs.session-token=fake-stub-token",
    });
    const res = proxy(withCookie);

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("http://localhost/coming-soon");
  });
});

describe("proxy() — gate-lifted (FR-008)", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("redirects /coming-soon to '/' (FR-008) when SAA_LAUNCH_AT is in the past", async () => {
    const { proxy } = await loadProxyWithEnv("2000-01-01T00:00:00Z");
    const res = proxy(requestFor("/coming-soon"));

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("http://localhost/");
  });

  it("passes '/' through to its normal handler when gate is lifted", async () => {
    const { proxy } = await loadProxyWithEnv("2000-01-01T00:00:00Z");
    const res = proxy(requestFor("/"));

    expect(res.status).not.toBe(307);
    expect(res.headers.get("Location")).toBeNull();
  });

  it("passes /login through to its normal handler when gate is lifted", async () => {
    const { proxy } = await loadProxyWithEnv("2000-01-01T00:00:00Z");
    const res = proxy(requestFor("/login"));

    expect(res.status).not.toBe(307);
  });
});

describe("proxy() — fail closed when env is null/empty/malformed (FR-009 / SC-004)", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it.each(["production", "development", "test"] as const)(
    "redirects to /coming-soon under NODE_ENV=%s when env is unset",
    async (nodeEnv) => {
      vi.stubEnv("NODE_ENV", nodeEnv);
      const { proxy } = await loadProxyWithEnv(undefined);
      const res = proxy(requestFor("/"));

      expect(res.status).toBe(307);
      expect(res.headers.get("Location")).toBe("http://localhost/coming-soon");
      vi.unstubAllEnvs();
    },
  );

  it("redirects when env is the empty string", async () => {
    const { proxy } = await loadProxyWithEnv("");
    const res = proxy(requestFor("/"));

    expect(res.status).toBe(307);
  });

  it("redirects when env is malformed (non-ISO 'garbage')", async () => {
    const { proxy } = await loadProxyWithEnv("not-a-date");
    const res = proxy(requestFor("/"));

    expect(res.status).toBe(307);
  });

  it("redirects when env is malformed (NaN parse '2025-13-99')", async () => {
    const { proxy } = await loadProxyWithEnv("2025-13-99");
    const res = proxy(requestFor("/"));

    expect(res.status).toBe(307);
  });

  it("still passes the prelaunch path itself through (renders --/--/--)", async () => {
    const { proxy } = await loadProxyWithEnv(undefined);
    const res = proxy(requestFor("/coming-soon"));

    expect(res.status).not.toBe(307);
  });
});

describe("proxy() — abuse cases (TR-002 A04)", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("does NOT treat '/coming-soon-evil' as the prelaunch path (exact match only)", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/coming-soon-evil"));

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("http://localhost/coming-soon");
  });

  it("does NOT whitelist '/_next-evil/foo' (prefix match requires the trailing slash)", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/_next-evil/foo"));

    expect(res.status).toBe(307);
  });
});
