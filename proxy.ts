import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-runtime proxy for the Login surface (Next.js 16 convention; replaces
 * the legacy `middleware.ts` file. Same behavior, new file/function name.)
 *
 *   1. Stamps every request with a UUID `x-request-id` so server-side log
 *      lines can be correlated. Downstream Server Components and route
 *      handlers can read the value via `headers().get('x-request-id')`.
 *   2. Adds the OWASP-recommended security headers to every response.
 *   3. Applies an in-memory token-bucket rate limit on the OAuth callback
 *      endpoints (Login spec TR-007 + abuse mitigation A07).
 *
 * NOTE on AsyncLocalStorage propagation: the logger module's ALS store
 * (`requestContext`) cannot be populated from this Edge-runtime proxy (it
 * imports `node:async_hooks`, which is unavailable on the Edge). Until a
 * per-route ALS bridge is wired up (Phase 7 follow-up), the logger falls
 * back to its `request_id="(unset)"` placeholder; the header carries the
 * correlation key in the meantime.
 */

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
