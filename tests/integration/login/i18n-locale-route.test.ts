import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore, authMock } = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn<(name: string) => { value: string } | undefined>(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  authMock: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookieStore),
}));
vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import { POST } from "@/app/api/i18n/locale/route";
import { prisma } from "@/src/lib/prisma";
import { clearAuthTables, createTestUser } from "@/tests/fixtures/users";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/i18n/locale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/i18n/locale (integration — real DB)", () => {
  beforeEach(async () => {
    await clearAuthTables();
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
    authMock.mockReset();
  });

  afterAll(async () => {
    await clearAuthTables();
    await prisma.$disconnect();
  });

  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(jsonRequest({ locale: "en-US" }));
    expect(res.status).toBe(401);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("returns 401 when the session has no user.id", async () => {
    authMock.mockResolvedValue({ user: { name: "anon" } });
    const res = await POST(jsonRequest({ locale: "en-US" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an unsupported locale (rejected by zod)", async () => {
    const user = await createTestUser();
    authMock.mockResolvedValue({ user: { id: user.id } });
    const res = await POST(jsonRequest({ locale: "fr-FR" }));
    expect(res.status).toBe(400);
    expect(cookieStore.set).not.toHaveBeenCalled();
    const reloaded = await prisma.user.findUnique({ where: { id: user.id } });
    expect(reloaded?.locale).toBe("vi-VN");
  });

  it("returns 400 for a malformed JSON body", async () => {
    const user = await createTestUser();
    authMock.mockResolvedValue({ user: { id: user.id } });
    const req = new Request("http://localhost/api/i18n/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 204, sets the saa_locale cookie, and updates User.locale on success", async () => {
    const user = await createTestUser({ locale: "vi-VN" });
    authMock.mockResolvedValue({ user: { id: user.id } });

    const res = await POST(jsonRequest({ locale: "en-US" }));

    expect(res.status).toBe(204);
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: "saa_locale", value: "en-US" }),
    );
    const reloaded = await prisma.user.findUnique({ where: { id: user.id } });
    expect(reloaded?.locale).toBe("en-US");
  });
});
