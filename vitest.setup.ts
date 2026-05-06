import "@testing-library/jest-dom/vitest";

// Point any DB-touching test at the dedicated test database. Must run before
// any test file's imports so the Prisma singleton (`src/lib/prisma`) reads the
// overridden value at first construction.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}
