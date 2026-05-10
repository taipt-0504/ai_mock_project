import { describe, expect, it } from "vitest";

import {
  PRELAUNCH_PATH,
  evaluateGate,
  isWhitelisted,
} from "@/src/lib/proxy/prelaunch-gate";

const NOW = new Date("2026-05-08T10:00:00.000Z");
const FUTURE = new Date("2026-06-01T09:00:00.000Z");
const PAST = new Date("2026-01-01T00:00:00.000Z");

describe("isWhitelisted (FR-007)", () => {
  it.each([
    PRELAUNCH_PATH,
    "/_next/static/abc.js",
    "/_next/data/foo.json",
    "/_next/image",
    "/assets/home/images/key-visual.png",
    "/assets/prelaunch/images/key-visual.png",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/api/health",
  ])("returns true for whitelisted path %s", (pathname) => {
    expect(isWhitelisted(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/login",
    "/awards",
    "/sun-kudos",
    "/profile",
    "/general-rules",
    "/api/auth/session",
    "/api/auth/callback/google",
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/notifications/unread-count",
    "/api/i18n/locale",
  ])("returns false for non-whitelisted path %s (Q-PG4: Auth.js paths excluded)", (pathname) => {
    expect(isWhitelisted(pathname)).toBe(false);
  });
});

describe("evaluateGate — gate active (launchAt is future or null)", () => {
  it.each([FUTURE, null])("redirects non-whitelisted '/' to %s when launchAt=%s", (launchAt) => {
    expect(evaluateGate("/", launchAt, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("redirects '/login' to /coming-soon (gate covers the auth surface)", () => {
    expect(evaluateGate("/login", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("redirects every Auth.js path to /coming-soon (Q-PG4)", () => {
    expect(evaluateGate("/api/auth/callback/google", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
    expect(evaluateGate("/api/auth/session", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("redirects application API paths (notifications, i18n) to /coming-soon", () => {
    expect(evaluateGate("/api/notifications/unread-count", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("passes the prelaunch path itself through (so the route can render)", () => {
    expect(evaluateGate(PRELAUNCH_PATH, FUTURE, NOW)).toEqual({ type: "passthrough" });
    expect(evaluateGate(PRELAUNCH_PATH, null, NOW)).toEqual({ type: "passthrough" });
  });

  it("passes whitelisted infrastructure paths through unchanged", () => {
    expect(evaluateGate("/_next/static/main.js", FUTURE, NOW)).toEqual({
      type: "passthrough",
    });
    expect(evaluateGate("/favicon.ico", FUTURE, NOW)).toEqual({ type: "passthrough" });
    expect(evaluateGate("/api/health", FUTURE, NOW)).toEqual({ type: "passthrough" });
  });
});

describe("evaluateGate — gate lifted (launchAt is past)", () => {
  it("redirects /coming-soon to '/' (FR-008)", () => {
    expect(evaluateGate(PRELAUNCH_PATH, PAST, NOW)).toEqual({
      type: "redirect",
      target: "/",
    });
  });

  it.each(["/", "/login", "/awards", "/api/auth/session", "/api/notifications/unread-count"])(
    "passes %s through to its normal route handler",
    (pathname) => {
      expect(evaluateGate(pathname, PAST, NOW)).toEqual({ type: "passthrough" });
    },
  );

  it("still passes whitelisted paths through (their behavior is gate-independent)", () => {
    expect(evaluateGate("/_next/data/foo.json", PAST, NOW)).toEqual({
      type: "passthrough",
    });
  });
});

describe("evaluateGate — null env (FR-009: always fail closed)", () => {
  it.each(["/", "/login", "/awards", "/api/auth/session"])(
    "redirects %s to /coming-soon as if the gate were active",
    (pathname) => {
      expect(evaluateGate(pathname, null, NOW)).toEqual({
        type: "redirect",
        target: PRELAUNCH_PATH,
      });
    },
  );

  it("still serves the prelaunch path itself (renders --/--/-- placeholders)", () => {
    expect(evaluateGate(PRELAUNCH_PATH, null, NOW)).toEqual({ type: "passthrough" });
  });
});

describe("evaluateGate — race at the zero boundary", () => {
  it("treats launchAt === now as gate-lifted (strict > comparison)", () => {
    expect(evaluateGate("/", NOW, NOW)).toEqual({ type: "passthrough" });
    expect(evaluateGate(PRELAUNCH_PATH, NOW, NOW)).toEqual({
      type: "redirect",
      target: "/",
    });
  });

  it("treats launchAt one millisecond in the future as gate-active", () => {
    const oneMsLater = new Date(NOW.getTime() + 1);
    expect(evaluateGate("/", oneMsLater, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });
});

describe("evaluateGate — demo bypass cookie (Phase 16, FR-010)", () => {
  // Mirrors the cookie-driven demo bypass: when `bypassActive=true` the gate
  // behaves as if it were lifted FOR THIS REQUEST regardless of `launchAt`.
  // Other requests in flight (no cookie) keep redirecting normally.
  it("with bypassActive=true, '/' passes through even when launchAt is in the future", () => {
    expect(evaluateGate("/", FUTURE, NOW, true)).toEqual({ type: "passthrough" });
  });

  it("with bypassActive=true, '/coming-soon' redirects to '/' so the user lands past the gate", () => {
    expect(evaluateGate(PRELAUNCH_PATH, FUTURE, NOW, true)).toEqual({
      type: "redirect",
      target: "/",
    });
  });

  it("with bypassActive=true, every Auth.js path passes through (so OAuth can complete in demo mode)", () => {
    expect(evaluateGate("/api/auth/callback/google", FUTURE, NOW, true)).toEqual({
      type: "passthrough",
    });
    expect(evaluateGate("/api/auth/session", null, NOW, true)).toEqual({
      type: "passthrough",
    });
  });

  it("bypassActive=true also overrides the FR-009 fail-closed null branch (demo bypass is explicit user consent)", () => {
    expect(evaluateGate("/", null, NOW, true)).toEqual({ type: "passthrough" });
  });

  it("bypassActive=false (default) keeps the original gate-active behavior", () => {
    expect(evaluateGate("/", FUTURE, NOW, false)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
    // Default param — no flag passed at all behaves like false.
    expect(evaluateGate("/", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("whitelisted paths stay passthrough regardless of bypass flag", () => {
    expect(evaluateGate("/_next/data/foo.json", FUTURE, NOW, true)).toEqual({
      type: "passthrough",
    });
    expect(evaluateGate("/favicon.ico", FUTURE, NOW, true)).toEqual({
      type: "passthrough",
    });
  });
});

describe("evaluateGate — abuse cases (TR-002 A04)", () => {
  it("path-traversal `/coming-soon/../awards` does NOT match the prelaunch path string — it redirects", () => {
    // Note: `proxy()` will normally pass already-normalized URL.pathname here,
    // but this guard ensures the gate does not match on a literal substring.
    expect(evaluateGate("/coming-soon/../awards", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("`/coming-soon-anything` is NOT treated as the prelaunch path (exact match only)", () => {
    expect(evaluateGate("/coming-soon-evil", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("`/_next-evil/foo` is NOT whitelisted (prefix match requires the trailing slash)", () => {
    expect(evaluateGate("/_next-evil/foo", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });

  it("`/assets-evil/foo` is NOT whitelisted", () => {
    expect(evaluateGate("/assets-evil/foo", FUTURE, NOW)).toEqual({
      type: "redirect",
      target: PRELAUNCH_PATH,
    });
  });
});
