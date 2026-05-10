import { formatEventDate } from "@/src/lib/event/format";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function EventInfo({
  locale,
  eventStart,
}: {
  locale: SupportedLocale;
  eventStart: Date | null;
}) {
  // FR-009 (revised 2026-05-10): derive the time value from
  // `SAA_EVENT_START_AT` so a single env var drives both the Hero countdown
  // target and this row. Falls back to the i18n catalog string when the env
  // is missing / malformed (`parseEventStart` returns null) so the page
  // never shows an empty value.
  const timeValue = eventStart
    ? formatEventDate(eventStart, locale)
    : t("home.event.time.value", locale);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row flex-wrap items-center gap-x-15 gap-y-2">
        <p className="font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg">
          <span>{t("home.event.time.label", locale)} </span>
          <span className="font-display text-2xl leading-8 text-saa-button-primary">
            {timeValue}
          </span>
        </p>
        <p className="font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg">
          <span>{t("home.event.location.label", locale)} </span>
          <span className="font-display text-2xl leading-8 text-saa-button-primary">
            {t("home.event.location.value", locale)}
          </span>
        </p>
      </div>
      <p className="font-display text-base font-bold leading-6 tracking-[0.5px] text-saa-page-fg">
        {t("home.event.facebook", locale)}
      </p>
    </div>
  );
}
