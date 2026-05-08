import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const REQUIRED_HEADERS = [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options",
] as const;

function requestFor(pathname: string): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: { "x-forwarded-for": "203.0.113.1" },
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

describe("proxy() — security headers preserved on prelaunch redirects (TR-002 A05)", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it.each(["/", "/login", "/awards", "/api/auth/session", "/api/notifications/unread-count"])(
    "attaches every OWASP header on a 307 redirect from %s during gate-active",
    async (path) => {
      const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
      const res = proxy(requestFor(path));

      expect(res.status).toBe(307);
      for (const name of REQUIRED_HEADERS) {
        expect(res.headers.get(name), `missing ${name} on ${path}`).not.toBeNull();
      }
    },
  );

  it("X-Content-Type-Options is exactly 'nosniff' on a gate redirect", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/"));
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("Referrer-Policy is 'strict-origin-when-cross-origin' on a gate redirect", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/"));
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("X-Frame-Options is 'DENY' on a gate redirect", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/"));
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("stamps a UUID x-request-id header on a gate-redirect response", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const res = proxy(requestFor("/"));
    expect(res.headers.get("x-request-id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("issues a fresh x-request-id per gate redirect", async () => {
    const { proxy } = await loadProxyWithEnv("2099-01-01T00:00:00Z");
    const a = proxy(requestFor("/")).headers.get("x-request-id");
    const b = proxy(requestFor("/")).headers.get("x-request-id");
    expect(a).not.toBe(b);
  });

  it("the post-gate /coming-soon → / redirect also carries the OWASP headers", async () => {
    const { proxy } = await loadProxyWithEnv("2000-01-01T00:00:00Z");
    const res = proxy(requestFor("/coming-soon"));

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe("http://localhost/");
    for (const name of REQUIRED_HEADERS) {
      expect(res.headers.get(name), `missing ${name} on post-gate redirect`).not.toBeNull();
    }
  });
});
