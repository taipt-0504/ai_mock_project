import { execSync } from "node:child_process";

/**
 * Vitest globalSetup — runs once before any test file.
 *
 * Resets the dedicated test database to a clean migrated state. Skipped when
 * DATABASE_URL_TEST is not configured (so unit-only test runs without a DB
 * still work).
 */
export default async function globalSetup() {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) {
     
    console.warn(
      "[tests/global-setup] DATABASE_URL_TEST not set — skipping `prisma migrate reset`. " +
        "Integration tests that touch the DB will fail until a test PG is configured.",
    );
    return;
  }

  execSync(
    "npx prisma migrate reset --force --skip-seed --schema=prisma/schema.prisma",
    {
      env: { ...process.env, DATABASE_URL: testUrl },
      stdio: "inherit",
    },
  );
}
