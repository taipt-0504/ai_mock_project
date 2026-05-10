import { clearGateBypassAction } from "@/src/actions/gate-bypass";
import { isGateBypassActive } from "@/src/lib/cookies/gate-bypass";
import { getSaaLocale } from "@/src/lib/cookies/saa-locale";
import { t } from "@/src/lib/i18n";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";

/**
 * **Demo-only** thin banner shown on every post-gate page when the
 * `saa_gate_bypass` cookie is set. Renders nothing when the cookie is
 * absent, so the banner is invisible during a normal authenticated
 * session — it only surfaces while a reviewer is actively in demo-bypass
 * mode and gives them one click to flip back into the pre-launch flow.
 *
 * Mounted once in `app/layout.tsx`; pulls its own locale (the layout is
 * the only host that doesn't already thread `locale` through its tree).
 */
export default async function GateBypassBanner() {
  let active = false;
  try {
    active = await isGateBypassActive();
  } catch (err) {
    logger.warn("gate-bypass.cookie-read-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
  if (!active) return null;

  let locale: SupportedLocale = DEFAULT_LOCALE;
  try {
    locale = await getSaaLocale();
  } catch (err) {
    logger.warn("locale.cookie-read-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex w-full flex-row flex-wrap items-center justify-center gap-3 border-b border-saa-dropdown-border bg-saa-button-primary/15 px-4 py-2 backdrop-blur-sm"
    >
      <p className="font-display text-sm leading-5 text-saa-page-fg">
        {t("gate.bypass.banner.text", locale)}
      </p>
      <form action={clearGateBypassAction}>
        <button
          type="submit"
          className="inline-flex h-7 items-center rounded-md bg-saa-button-primary px-3 font-display text-xs font-bold uppercase tracking-wide text-saa-button-primary-fg motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          {t("gate.bypass.banner.button", locale)}
        </button>
      </form>
    </div>
  );
}
