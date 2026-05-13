import { expect, test, type BrowserContext } from "@playwright/test";

import { PrismaClient } from "@prisma/client";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";
import { clearAuthTables, disconnect, seedAuthenticatedUser } from "./fixtures/db";

/**
 * Phase 4 T030 — US1 "Viết một Kudo mới" end-to-end coverage.
 *
 * The Viết Kudo dialog (`ihQ26W78P2`) is out of scope per Q-PLAN9 — A.1
 * navigates to the stub route `/sun-kudos/write` and full submit UX lands
 * with the dialog. This spec exercises the parts that DO ship in Phase 4:
 * - (a) Click A.1 → navigate to /sun-kudos/write.
 * - (b) Anon click A.1 / direct visit → /login redirect (US1 #5).
 * - (c) Submit via API blank content → 400 (US1 #2 surface; dialog binds
 *       this rejection to UI in a future phase).
 * - (d) Submit via API valid body → 201 + DB row + sender counter
 *       incremented; subsequent GET to /sun-kudos still loads (US1 #3
 *       feed refresh ships with Phase 5 feed UI).
 */

const prisma = new PrismaClient();

async function signIn(
  context: BrowserContext,
  opts?: { userId?: string; email?: string; sessionToken?: string },
): Promise<{ userId: string; sessionToken: string }> {
  const { sessionToken, userId } = await seedAuthenticatedUser({
    userId: opts?.userId ?? "kudos-create-user",
    email: opts?.email ?? "kudos-create@example.com",
    sessionToken: opts?.sessionToken ?? "kudos-create-session",
  });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);
  return { userId, sessionToken };
}

async function seedReceiver(id: string): Promise<string> {
  await prisma.user.upsert({
    where: { id },
    create: { id, email: `${id}@example.com`, name: "Receiver" },
    update: {},
  });
  return id;
}

test.describe("Sun* Kudos — Create flow (US1, T030)", () => {
  test.beforeEach(async () => {
    await prisma.kudoLike.deleteMany();
    await prisma.kudoImage.deleteMany();
    await prisma.kudoHashtag.deleteMany();
    await prisma.kudo.deleteMany();
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await prisma.kudoLike.deleteMany();
    await prisma.kudoImage.deleteMany();
    await prisma.kudoHashtag.deleteMany();
    await prisma.kudo.deleteMany();
    await clearAuthTables();
    await prisma.$disconnect();
    await disconnect();
  });

  test("US1 #1 — authenticated click on A.1 navigates to /sun-kudos/write (dialog stub)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/sun-kudos");

    const trigger = page.getByRole("button", {
      name: viCatalog["kudos.write.input.aria_label"],
    });
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page).toHaveURL(/\/sun-kudos\/write$/);
    await expect(
      page.getByRole("heading", { name: viCatalog["kudos.write.stub.title"] }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: viCatalog["kudos.write.stub.back"] }),
    ).toBeVisible();
  });

  test("US1 #5 — anonymous direct visit to /sun-kudos/write redirects to /login", async ({
    page,
  }) => {
    const response = await page.request.get("/sun-kudos/write", {
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308]).toContain(response.status());
    expect(response.headers()["location"]).toBe("/login");
  });

  test("US1 #5 — anonymous POST /api/kudos is rejected with 401", async ({
    request,
  }) => {
    const res = await request.post("/api/kudos", {
      data: {
        receiverUserId: "anyone",
        content: "hi",
        hashtagIds: [],
        imageUrls: [],
      },
    });
    expect(res.status()).toBe(401);
  });

  test("US1 #2 — authenticated POST with blank content is rejected with 400 (Zod gate)", async ({
    page,
    context,
  }) => {
    const { userId } = await signIn(context, {
      userId: "kudos-blank-sender",
      email: "kudos-blank-sender@example.com",
      sessionToken: "kudos-blank-session",
    });
    const receiverId = await seedReceiver("kudos-blank-receiver");

    const res = await page.request.post("/api/kudos", {
      data: {
        receiverUserId: receiverId,
        content: "",
        hashtagIds: [],
        imageUrls: [],
      },
    });
    expect(res.status()).toBe(400);

    const senderRow = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    expect(senderRow.kudosSentCount).toBe(0);
  });

  test("US1 #3 — authenticated POST with valid body returns 201, persists the Kudo, and increments counters; /sun-kudos still renders for the next request (Q-PLAN9 router.refresh path)", async ({
    page,
    context,
  }) => {
    const { userId: senderId } = await signIn(context, {
      userId: "kudos-happy-sender",
      email: "kudos-happy-sender@example.com",
      sessionToken: "kudos-happy-session",
    });
    const receiverId = await seedReceiver("kudos-happy-receiver");

    const res = await page.request.post("/api/kudos", {
      data: {
        receiverUserId: receiverId,
        content: "Cảm ơn bạn vì đã review PR sát ngày demo!",
        hashtagIds: [],
        imageUrls: [],
      },
    });
    expect(res.status()).toBe(201);
    const body = (await res.json()) as {
      id: string;
      content: string;
      sender: { id: string };
      receiver: { id: string };
    };
    expect(body.sender.id).toBe(senderId);
    expect(body.receiver.id).toBe(receiverId);

    const persisted = await prisma.kudo.findUniqueOrThrow({
      where: { id: body.id },
    });
    expect(persisted.content).toContain("Cảm ơn");

    const senderRow = await prisma.user.findUniqueOrThrow({
      where: { id: senderId },
    });
    expect(senderRow.kudosSentCount).toBe(1);

    const receiverRow = await prisma.user.findUniqueOrThrow({
      where: { id: receiverId },
    });
    expect(receiverRow.kudosReceivedCount).toBe(1);

    // The board page must still render after the mutation — Phase 5 wires
    // the actual feed; for now this guards against accidental regressions in
    // the auth gate or the layout following the create call.
    const boardRes = await page.goto("/sun-kudos");
    expect(boardRes?.status()).toBe(200);
    await expect(
      page.getByRole("button", {
        name: viCatalog["kudos.write.input.aria_label"],
      }),
    ).toBeVisible();
  });
});
