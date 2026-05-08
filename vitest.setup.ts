import "@testing-library/jest-dom/vitest";

// Point any DB-touching test at the dedicated test database. Must run before
// any test file's imports so the Prisma singleton (`src/lib/prisma`) reads the
// overridden value at first construction.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

// Prelaunch gate (FR-009 — fail closed when null). Default to "gate disabled"
// for the Vitest suite so existing Login + Homepage tests continue to assert
// passthrough behavior. Tests that need to exercise the gate-active branch
// MUST opt in explicitly via `vi.stubEnv("SAA_LAUNCH_AT", "<future ISO>")`
// + `vi.resetModules()` (see tests/integration/prelaunch/*).
if (!process.env.SAA_LAUNCH_AT) {
  process.env.SAA_LAUNCH_AT = "2000-01-01T00:00:00Z";
}
