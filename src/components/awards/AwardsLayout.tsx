import AwardsList from "@/src/components/awards/AwardsList";
import type { SupportedLocale } from "@/src/lib/i18n/types";

/**
 * Two-column layout for Hệ thống giải. Left column hosts the in-page menu
 * (`AwardsNav`, lands in Phase 4); right column hosts the six detail cards.
 *
 * Phase 3 ships only the right column — the left side is a layout-only
 * placeholder so the menu can drop in without rearranging anything else.
 */
export default function AwardsLayout({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="flex w-full max-w-[1152px] flex-col gap-20 lg:flex-row lg:items-start lg:justify-between">
      <aside aria-hidden="true" className="hidden w-[178px] shrink-0 lg:block" />
      <AwardsList locale={locale} />
    </section>
  );
}
