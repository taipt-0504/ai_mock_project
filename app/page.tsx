import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";

// Replaces the create-next-app boilerplate. Acts as the auth-gated post-
// login destination — Homepage SAA's real spec/plan/implementation are a
// separate feature (out-of-scope per plan.md).
export const dynamic = "force-dynamic";

export default async function Home() {
  let hasSession = false;
  try {
    const session = await auth();
    hasSession = Boolean(session?.user);
  } catch (err) {
    logger.warn("auth.lookup-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  if (!hasSession) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-saa-page text-saa-page-fg">
      <h1 className="font-display text-3xl font-bold">
        Authenticated — Homepage SAA placeholder
      </h1>
      <p className="mt-4 font-display text-base">
        The real Homepage SAA (screenId&nbsp;
        <code>i87tDx10uM</code>) ships in a follow-up feature.
      </p>
    </main>
  );
}
