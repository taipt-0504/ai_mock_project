import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { __resetRateLimitForTests, proxy } from "@/proxy";

function callbackRequest(ip: string): NextRequest {
  return new NextRequest("http://localhost/api/auth/callback/google", {
    headers: { "x-forwarded-for": ip },
  });
}

const RATE_LIMIT_MAX_REQUESTS = 10;

describe("proxy — rate limit on /api/auth/callback/*", () => {
  beforeEach(() => __resetRateLimitForTests());

  it("allows the first N requests from a single IP within the window", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      const res = proxy(callbackRequest("198.51.100.1"));
      expect(res.status, `request #${i + 1}`).not.toBe(429);
    }
  });

  it("returns 429 on the (N+1)th request from the same IP", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      proxy(callbackRequest("198.51.100.2"));
    }
    const overflow = proxy(callbackRequest("198.51.100.2"));
    expect(overflow.status).toBe(429);
    expect(overflow.headers.get("Retry-After")).not.toBeNull();
  });

  it("attaches security headers and a request_id even on a 429 response", () => {
    for (let i = 0; i <= RATE_LIMIT_MAX_REQUESTS; i++) {
      proxy(callbackRequest("198.51.100.3"));
    }
    const limited = proxy(callbackRequest("198.51.100.3"));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Content-Security-Policy")).not.toBeNull();
    expect(limited.headers.get("X-Frame-Options")).toBe("DENY");
    expect(limited.headers.get("x-request-id")).toMatch(/[0-9a-f-]{36}/i);
  });

  it("scopes the budget per IP — distinct IPs each get their own bucket", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      proxy(callbackRequest("198.51.100.10"));
    }
    // IP #10 is now at its limit — but a fresh IP should still be allowed.
    const fresh = proxy(callbackRequest("198.51.100.11"));
    expect(fresh.status).not.toBe(429);
  });

  it("does NOT rate-limit non-callback paths", () => {
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS + 5; i++) {
      const res = proxy(
        new NextRequest("http://localhost/login", {
          headers: { "x-forwarded-for": "198.51.100.20" },
        }),
      );
      expect(res.status).not.toBe(429);
    }
  });
});
