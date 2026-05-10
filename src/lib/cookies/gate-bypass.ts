import { cookies } from "next/headers";

import { config } from "@/src/lib/config";

/**
 * **DEMO-ONLY** prelaunch-gate bypass cookie.
 *
 * Set when the user clicks the "Skip prelaunch (demo)" button on
 * `/coming-soon`. While present (httpOnly, 7-day TTL), the proxy lets the
 * request through as if `SAA_LAUNCH_AT` were already in the past — for THAT
 * user only. Other visitors keep seeing the prelaunch screen normally.
 *
 * This exists because the SAA 2025 codebase is a portfolio / demo project:
 * reviewers need a one-click way to flip between "gate active" and "gate
 * lifted" without rebuilding the deploy. In a real production stance the
 * gate would never have a public bypass button; remove the alert UI in
 * `PrelaunchScreen.tsx` + this whole module to revert.
 */
export const GATE_BYPASS_COOKIE = "saa_gate_bypass";
const BYPASS_VALUE = "1" as const;
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

/**
 * Server Component / Server Action reader. Returns true iff the request
 * carries the documented bypass cookie with the canonical sentinel value.
 * Anything else (missing, empty, tampered) returns false — the gate stays
 * active.
 */
export async function isGateBypassActive(): Promise<boolean> {
  const store = await cookies();
  return store.get(GATE_BYPASS_COOKIE)?.value === BYPASS_VALUE;
}

export async function setGateBypass(): Promise<void> {
  const store = await cookies();
  store.set({
    name: GATE_BYPASS_COOKIE,
    value: BYPASS_VALUE,
    path: "/",
    sameSite: "lax",
    maxAge: SEVEN_DAYS_SECONDS,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  });
}

export async function clearGateBypass(): Promise<void> {
  const store = await cookies();
  store.delete(GATE_BYPASS_COOKIE);
}

/**
 * Proxy reader (synchronous, runs on every request). Reads from a
 * `NextRequest`-shaped cookie store rather than `next/headers` because
 * `proxy.ts` cannot use the Server Component cookie API. The shape is the
 * minimum surface — any object with `cookies.get(name): { value: string }`
 * is accepted so the helper is trivially testable.
 */
export function hasGateBypassCookie(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
}): boolean {
  return request.cookies.get(GATE_BYPASS_COOKIE)?.value === BYPASS_VALUE;
}
