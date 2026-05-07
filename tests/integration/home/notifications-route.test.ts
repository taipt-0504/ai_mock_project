import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
}));
vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import { GET } from "@/app/api/notifications/unread-count/route";

describe("GET /api/notifications/unread-count (US8 / FR-018)", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session (anonymous request, no leak)", async () => {
    authMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
    // Anonymous error responses must still set Cache-Control: no-store so
    // downstream caches don't pin the 401.
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 401 when the session has no user.id (degenerate session shape)", async () => {
    authMock.mockResolvedValue({ user: { name: "anon" } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 + { unreadCount: 0 } for an authenticated session (v1 stub)", async () => {
    authMock.mockResolvedValue({ user: { id: "test-user-id" } });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ unreadCount: 0 });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
