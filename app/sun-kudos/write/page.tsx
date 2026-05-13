import type { Session } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/src/lib/auth";
import { getSaaLocale } from "@/src/lib/cookies/saa-locale";
import { t } from "@/src/lib/i18n";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Stub destination for the A.1 button ghi nhận. The Viết Kudo dialog
 * (Figma `ihQ26W78P2`) is out of scope per Q-PLAN9 — this placeholder keeps
 * the navigation flow honest until Phase 4 dialog work ships. The page
 * inherits the same Auth.js gate as `/sun-kudos` so anon visitors land on
 * `/login` instead of the placeholder.
 */
export default async function KudosWriteStubPage() {
  let session: Session | null = null;
  try {
    session = (await auth()) as Session | null;
  } catch (err) {
    logger.warn("auth.lookup-failed", {
      message: err instanceof Error ? err.message : "unknown",
      route: "/sun-kudos/write",
    });
  }

  if (!session?.user) {
    redirect("/login");
  }

  const locale: SupportedLocale = await getSaaLocale().catch((err) => {
    logger.warn("locale.cookie-read-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return DEFAULT_LOCALE;
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-saa-page px-6 text-center text-saa-page-fg">
      <h1 className="font-display text-3xl font-bold leading-9 tracking-[0.15px] text-saa-button-primary">
        {t("kudos.write.stub.title", locale)}
      </h1>
      <p className="max-w-xl font-display text-base font-medium leading-6 text-saa-page-fg">
        {t("kudos.write.stub.description", locale)}
      </p>
      <Link
        href="/sun-kudos"
        className="rounded-full border border-saa-dropdown-border bg-saa-kudos-filter px-6 py-3 font-display text-base font-bold leading-6 text-saa-page-fg transition-colors hover:bg-saa-kudos-filter-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-button-primary focus-visible:ring-offset-2 focus-visible:ring-offset-saa-page"
      >
        {t("kudos.write.stub.back", locale)}
      </Link>
    </main>
  );
}
