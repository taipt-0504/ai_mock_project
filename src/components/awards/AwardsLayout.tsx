import AwardsList from "@/src/components/awards/AwardsList";
import AwardsNav from "@/src/components/awards/AwardsNav";
import type { SupportedLocale } from "@/src/lib/i18n/types";

/**
 * Two-column layout for Hệ thống giải. Left column hosts the in-page menu
 * (`AwardsNav` — Client island, scroll-tracking); right column hosts the six
 * detail cards. Below `lg:`, the menu is hidden — narrow viewports rely on
 * native scroll only (Q-HTG4).
 */
export default function AwardsLayout({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="flex w-full max-w-[1152px] flex-col gap-20 lg:flex-row lg:items-start lg:justify-between">
      <div className="hidden shrink-0 lg:block">
        <AwardsNav locale={locale} />
      </div>
      <AwardsList locale={locale} />
    </section>
  );
}
