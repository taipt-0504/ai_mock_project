/**
 * Idempotent seed script.
 * No data is required to seed for the Login feature — Auth.js + Google OAuth
 * provisions users implicitly on first sign-in. This stub exists so
 * `npm run db:seed` works once the project gains seed-worthy data later.
 */
async function main(): Promise<void> {
  // intentionally empty
}

main().catch((err) => {
   
  console.error("[prisma/seed] failed:", err);
  process.exit(1);
});
