import { NextResponse, type NextRequest } from "next/server";

import { config as appConfig } from "@/src/lib/config";
import { hasGateBypassCookie } from "@/src/lib/cookies/gate-bypass";
import { parseLaunchAt } from "@/src/lib/event/event-config";
import { logger } from "@/src/lib/logger";
import { evaluateGate } from "@/src/lib/proxy/prelaunch-gate";

/**
 * Next.js 16 `proxy.ts` — runs on the **Node.js runtime** (Edge is not
 * supported in Next.js 16 `proxy`; see the upgrade guide). Owns three
 * concerns, in order:
 *
 *   1. **Prelaunch gate** (Prelaunch spec FR-006/FR-007/FR-008/FR-009).
 *      Short-circuits with a 307 redirect to `/coming-soon` while
 *      `SAA_LAUNCH_AT > now()` (or env is null/malformed — fail closed),
 *      OR redirects `/coming-soon` → `/` once the gate has lifted.
 *      Whitelisted infrastructure paths pass through unchanged.
 *      Redirect responses STILL flow through `applySecurityHeaders` so the
 *      OWASP header set attaches to 307s (TR-002 A05).
 *
 *   2. **Request correlation**: stamps every response with a UUID
 *      `x-request-id` so server-side log lines can be correlated.
 *
 *   3. **Login pipeline** (existing): adds OWASP-recommended security
 *      headers + an in-memory token-bucket rate limit on the OAuth callback
 *      endpoints (Login spec TR-007 + abuse mitigation A07).
 *
 * The gate-active branch makes the rate limit on `/api/auth/callback`
 * effectively unreachable during the prelaunch window because Auth.js paths
 * are NOT whitelisted (Q-PG4) — acceptable; the rate limit serves
 * post-gate-lift traffic.
 *
 * NOTE on AsyncLocalStorage propagation: the logger module's ALS store
 * (`requestContext`) cannot be populated from the proxy directly (it
 * imports `node:async_hooks`). Until a per-route ALS bridge is wired up,
 * the logger falls back to `request_id="(unset)"`; the `x-request-id`
 * response header carries the correlation key in the meantime.
 */

// why: parsed once at module load to keep the gate decision a pure compare
// per request (TR-001 perf budget — ≤ 5ms p50 / ≤ 15ms p99 added to TTFB).
const LAUNCH_AT: Date | null = parseLaunchAt(appConfig.SAA_LAUNCH_AT);

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  // Allow self + inline (Next.js injects inline runtime), data: images, and
  // HTTPS for fetched assets. Tighten further in production after audit.
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

const RATE_LIMIT_PATH_PREFIX = "/api/auth/callback";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

type Bucket = { tokens: number; resetAt: number };
// In-process bucket. Edge workers may have separate instances — fine for
// dev/test; production should swap for a shared store (Redis) per Phase 7.
const rateLimitBucket = new Map<string, Bucket>();

/**
 * Internal: clear the bucket — exported for tests so consecutive specs
 * don't carry budget across each other.
 */
export function __resetRateLimitForTests(): void {
  rateLimitBucket.clear();
}

function isRateLimited(key: string, now: number): boolean {
  const bucket = rateLimitBucket.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBucket.set(key, {
      tokens: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }
  if (bucket.tokens <= 0) return true;
  bucket.tokens -= 1;
  return false;
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
}

export function proxy(request: NextRequest): NextResponse {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);

  const decision = evaluateGate(
    url.pathname,
    LAUNCH_AT,
    new Date(),
    hasGateBypassCookie(request),
  );

  if (decision.type === "redirect") {
    logger.debug("prelaunch-gate", {
      kind: "prelaunch-gate",
      path: url.pathname,
      decision: "redirect",
      target: decision.target,
    });
    const redirect = NextResponse.redirect(
      new URL(decision.target, request.url),
      307,
    );
    redirect.headers.set("x-request-id", requestId);
    return applySecurityHeaders(redirect);
  }

  logger.debug("prelaunch-gate", {
    kind: "prelaunch-gate",
    path: url.pathname,
    decision: "passthrough",
  });

  if (url.pathname.startsWith(RATE_LIMIT_PATH_PREFIX)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (isRateLimited(ip, Date.now())) {
      const limited = new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) },
      });
      limited.headers.set("x-request-id", requestId);
      return applySecurityHeaders(limited);
    }
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: forwardedHeaders },
  });
  response.headers.set("x-request-id", requestId);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
