import { redirect } from "next/navigation";

import PrelaunchScreen from "@/src/components/prelaunch/PrelaunchScreen";
import { config } from "@/src/lib/config";
import { getSaaLocale } from "@/src/lib/cookies/saa-locale";
import { isGateLifted, parseLaunchAt } from "@/src/lib/event/event-config";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Prelaunch route — auth-agnostic by design (Prelaunch spec FR-002). Does
 * NOT call `auth()` and does NOT branch on session state. The proxy is the
 * authoritative gate; this in-route `redirect("/")` is a defensive backstop
 * for the post-gate-lift state in case the proxy is bypassed (FR-008).
 */
export default async function ComingSoon() {
  const launchAt = parseLaunchAt(config.SAA_LAUNCH_AT);

  if (isGateLifted(launchAt)) {
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

  return <PrelaunchScreen launchAt={launchAt} locale={locale} />;
}
