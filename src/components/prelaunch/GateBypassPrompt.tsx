import { enableGateBypassAction } from "@/src/actions/gate-bypass";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

/**
 * **Demo-only** alert below the prelaunch countdown. Lets reviewers click
 * past the gate without rebuilding or flipping `SAA_LAUNCH_AT`. The button
 * posts to a Server Action that sets a 7-day httpOnly cookie and redirects
 * to `/`. Remove this component (and the `gate.bypass.*` i18n keys + the
 * cookie helpers) to revert to a strict, no-bypass pre-launch surface.
 */
export default function GateBypassPrompt({
  locale,
}: {
  locale: SupportedLocale;
}) {
  return (
    <aside
      role="alert"
      aria-live="polite"
      className="mt-8 flex max-w-[640px] flex-col items-center gap-3 rounded-lg border border-saa-dropdown-border bg-saa-button-primary/10 px-6 py-4 text-center"
    >
      <p className="font-display text-base font-bold leading-6 text-saa-button-primary">
        {t("gate.bypass.alert.title", locale)}
      </p>
      <p className="font-display text-sm leading-5 text-saa-page-fg/90">
        {t("gate.bypass.alert.description", locale)}
      </p>
      <form action={enableGateBypassAction}>
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-saa-button-primary px-5 font-display text-sm font-bold uppercase tracking-wide text-saa-button-primary-fg motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          {t("gate.bypass.alert.button", locale)}
        </button>
      </form>
    </aside>
  );
}
