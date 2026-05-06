import Image from "next/image";
import { redirect } from "next/navigation";

import Footer from "@/src/components/footer/Footer";
import Header from "@/src/components/header/Header";
import HeroSection from "@/src/components/login/HeroSection";
import { auth } from "@/src/lib/auth";
import { getSaaLocale } from "@/src/lib/cookies/saa-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";

// Login MUST be rendered at request time so the auth check below runs on
// every visit (spec State Management § Cache & invalidation). Without this
// flag Next.js may statically prerender and serve the page to authenticated
// users without a redirect.
export const dynamic = "force-dynamic";

/**
 * Login page (FRAME GzbNeVGJHz).
 *
 * Server-side gate (FR-002 / US2 / TR-001): if a session exists, redirect
 * to `/` BEFORE any markup is sent. If the session lookup itself errors
 * (DB outage), fall through to render Login as unauthenticated and log the
 * failure — never 5xx the user (spec State Management § Loading & error
 * states + edge case "Stale or revoked session").
 */
export default async function LoginPage() {
  let hasSession = false;
  try {
    const session = await auth();
    hasSession = Boolean(session?.user);
  } catch (err) {
    logger.warn("auth.lookup-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  if (hasSession) {
    redirect("/");
  }

  let locale: SupportedLocale = DEFAULT_LOCALE;
  try {
    locale = await getSaaLocale();
  } catch (err) {
    logger.warn("locale.cookie-read-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-saa-page text-saa-page-fg">
      {/* Background layer 2 — key visual artwork (decorative). */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <Image
          src="/assets/login/images/key-visual.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
      </div>
      {/* Background layer 3 — left-to-right dark fade. */}
      <div
        aria-hidden="true"
        className="saa-overlay-fade-left absolute inset-0 z-[1]"
      />
      {/* Background layer 4 — bottom-up dark fade. */}
      <div
        aria-hidden="true"
        className="saa-overlay-fade-bottom absolute inset-x-0 bottom-0 z-[2] h-[1093px]"
      />

      <Header locale={locale} />
      <HeroSection locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
