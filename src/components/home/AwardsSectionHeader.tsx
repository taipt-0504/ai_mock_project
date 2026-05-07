import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function AwardsSectionHeader({
  locale,
}: {
  locale: SupportedLocale;
}) {
  return (
    <header className="flex w-full max-w-[1224px] flex-col items-start gap-4">
      <p className="font-display text-2xl font-bold leading-8 text-saa-page-fg">
        Sun* annual awards 2025
      </p>
      <hr className="h-px w-full border-0 bg-saa-divider" />
      <h2 className="font-display text-[57px] font-bold leading-[64px] tracking-[-0.25px] text-saa-button-primary">
        {t("home.awards.section.heading", locale)}
      </h2>
    </header>
  );
}
