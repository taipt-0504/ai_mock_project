import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const prisma = new PrismaClient();
const SESSION_TOKEN = "ui-screenshot-session-1";
const USER_ID = "ui-screenshot-user-1";

async function seedSession() {
  await prisma.user.upsert({
    where: { id: USER_ID },
    create: {
      id: USER_ID,
      email: "ui-screenshot@example.com",
      name: "Alice",
      locale: "en-US",
    },
    update: { locale: "en-US", name: "Alice" },
  });
  await prisma.session.upsert({
    where: { sessionToken: SESSION_TOKEN },
    create: {
      sessionToken: SESSION_TOKEN,
      userId: USER_ID,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    update: {
      userId: USER_ID,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
}

async function main() {
  await seedSession();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1512, height: 900 },
  });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: SESSION_TOKEN,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });

  // Open the profile dropdown.
  const trigger = page.getByRole("button", { name: "Alice" });
  await trigger.click();
  await page.getByRole("menu").waitFor({ state: "visible" });

  // Pause to ensure transition / fonts settle.
  await page.waitForTimeout(300);

  // Variant 1: menu open with no hover.
  await page
    .locator('[role="menu"]')
    .screenshot({
      path: ".momorph/specs/z4sCl3_Qtk-dropdown-profile/assets/implementation-default.png",
      omitBackground: false,
    });

  // Variant 2: hover Profile to surface active glow.
  const profileItem = page.locator('a[role="menuitem"][href="/profile"]');
  await profileItem.hover();
  await page.waitForTimeout(300);
  await page
    .locator('[role="menu"]')
    .screenshot({
      path: ".momorph/specs/z4sCl3_Qtk-dropdown-profile/assets/implementation-hover.png",
      omitBackground: false,
    });

  await browser.close();
  await prisma.session.delete({ where: { sessionToken: SESSION_TOKEN } });
  await prisma.user.delete({ where: { id: USER_ID } });
  await prisma.$disconnect();
  console.log("Screenshots saved.");
}

main().catch(async (err) => {
  console.error(err);
  try {
    await prisma.session.delete({ where: { sessionToken: SESSION_TOKEN } });
    await prisma.user.delete({ where: { id: USER_ID } });
  } catch {}
  await prisma.$disconnect();
  process.exit(1);
});
