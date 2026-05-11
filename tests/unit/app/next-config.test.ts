import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

/**
 * Guards `next.config.ts` `images.remotePatterns`. New external image hosts
 * MUST be added before any `next/image` consumes their URLs; otherwise the
 * runtime throws. Every screen that introduces a new remote image source
 * adds an assertion here in lockstep with the host entry.
 */
describe("next.config.ts — images.remotePatterns", () => {
  const patterns = nextConfig.images?.remotePatterns ?? [];

  it("includes Gmail OAuth avatar host `lh3.googleusercontent.com /a/**`", () => {
    // Used by: Auth.js Google provider `User.image`. Consumed by
    //  Sun* Kudos card avatars (Phase 5) — Q-PLAN7 reuse `User.image`,
    //  Sidebar leaderboards (Phase 8) — leaderboard avatars,
    //  Spotlight node hover popup (Phase 9),
    //  Header `ProfileButton` (already shipped — Homepage).
    expect(patterns).toContainEqual(
      expect.objectContaining({
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      }),
    );
  });

  it("only declares hosts that are actually consumed (no orphan patterns)", () => {
    // Allowlist of hosts that are currently consumed by `<Image>` somewhere
    // in the codebase. Update when adding a new host AND verify the host
    // is actually rendered (search `next/image` callsites for the URL).
    const allowed = new Set([
      "lh3.googleusercontent.com",
      // "picsum.photos" — to be added in Phase 1 (DB seed) when
      // KudoImage rows use placeholder URLs (Q-PLAN4 parked).
    ]);
    for (const p of patterns) {
      if (typeof p === "string") continue;
      expect(allowed.has(p.hostname ?? "")).toBe(true);
    }
  });
});
