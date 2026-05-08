import type { GateDecision } from "@/src/lib/proxy/prelaunch-gate.types";

/**
 * Prelaunch route. While the gate is active every non-whitelisted request
 * redirects here; while the gate is lifted requests to this path redirect
 * to `/`. Single source of truth for the path string.
 */
export const PRELAUNCH_PATH = "/coming-soon" as const;

const ROOT_STATIC_FILES: ReadonlySet<string> = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

/**
 * Whitelist for the prelaunch gate (Prelaunch spec FR-007 + Q-PG4).
 *
 * Whitelisted (passthrough during the gate window):
 *   - The prelaunch route itself (`/coming-soon`)
 *   - Next.js internals (`/_next/*`)
 *   - Public static assets (`/assets/*`) — also excluded by the proxy matcher;
 *     this guard remains as defense-in-depth for any matcher tweak
 *   - Root-level static files: `/favicon.ico`, `/robots.txt`, `/sitemap.xml`
 *   - Diagnostic endpoint `/api/health` (reserved — not yet a route)
 *
 * NOT whitelisted (redirect to `/coming-soon`):
 *   - Every Auth.js path under `/api/auth/*` (Q-PG4: deliberately excluded so
 *     OAuth callbacks cannot complete during the gate window)
 *   - Every other application route and API
 */
export function isWhitelisted(pathname: string): boolean {
  if (pathname === PRELAUNCH_PATH) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/assets/")) return true;
  if (ROOT_STATIC_FILES.has(pathname)) return true;
  if (pathname === "/api/health") return true;
  return false;
}

/**
 * Pure gate decision. The proxy parses `SAA_LAUNCH_AT` once at module load
 * and feeds the parsed `Date | null` plus the request's `pathname` and a
 * single `now` snapshot. Taking `now` as a parameter keeps the function
 * deterministic and testable.
 *
 * Decision matrix (Prelaunch spec FR-006):
 *
 *   pathname === PRELAUNCH_PATH:
 *     - launchAt is past   → redirect "/"          (FR-008, gate lifted)
 *     - launchAt is null/future → passthrough       (FR-001, render screen)
 *
 *   isWhitelisted(pathname):
 *     - always passthrough
 *
 *   any other path:
 *     - launchAt is null/future → redirect PRELAUNCH_PATH (FR-006/FR-009)
 *     - launchAt is past         → passthrough              (gate lifted)
 */
export function evaluateGate(
  pathname: string,
  launchAt: Date | null,
  now: Date,
): GateDecision {
  const gateActive = launchAt === null || launchAt.getTime() > now.getTime();

  if (pathname === PRELAUNCH_PATH) {
    return gateActive ? { type: "passthrough" } : { type: "redirect", target: "/" };
  }

  if (isWhitelisted(pathname)) {
    return { type: "passthrough" };
  }

  return gateActive
    ? { type: "redirect", target: PRELAUNCH_PATH }
    : { type: "passthrough" };
}
