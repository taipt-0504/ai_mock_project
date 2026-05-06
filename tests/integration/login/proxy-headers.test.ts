import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { __resetRateLimitForTests, proxy } from "@/proxy";

function requestFor(pathname: string, ip = "203.0.113.1"): NextRequest {
  return new NextRequest(`http://localhost${pathname}`, {
    headers: { "x-forwarded-for": ip },
  });
}

const REQUIRED_HEADERS = [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options",
] as const;

describe("proxy — security headers", () => {
  beforeEach(() => __resetRateLimitForTests());

  it.each(["/login", "/api/auth/session", "/api/i18n/locale"])(
    "attaches every required security header on %s",
    (path) => {
      const res = proxy(requestFor(path));
      for (const name of REQUIRED_HEADERS) {
        expect(res.headers.get(name), `missing ${name} on ${path}`).not.toBeNull();
      }
    },
  );

  it("X-Content-Type-Options is exactly 'nosniff'", () => {
    const res = proxy(requestFor("/login"));
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("Referrer-Policy is exactly 'strict-origin-when-cross-origin'", () => {
    const res = proxy(requestFor("/login"));
    expect(res.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("X-Frame-Options is exactly 'DENY'", () => {
    const res = proxy(requestFor("/login"));
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("emits a UUID request_id header on every response", () => {
    const res = proxy(requestFor("/login"));
    const reqId = res.headers.get("x-request-id");
    expect(reqId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("issues a fresh request_id per request", () => {
    const a = proxy(requestFor("/login")).headers.get("x-request-id");
    const b = proxy(requestFor("/login")).headers.get("x-request-id");
    expect(a).not.toBe(b);
  });
});
