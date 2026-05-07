import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function EventInfo({ locale }: { locale: SupportedLocale }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row flex-wrap items-center gap-x-15 gap-y-2">
        <p className="font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg">
          <span>{t("home.event.time.label", locale)} </span>
          <span className="font-display text-2xl leading-8 text-saa-button-primary">
            {t("home.event.time.value", locale)}
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
