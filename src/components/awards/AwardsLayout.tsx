import AwardsList from "@/src/components/awards/AwardsList";
import AwardsNav from "@/src/components/awards/AwardsNav";
import type { SupportedLocale } from "@/src/lib/i18n/types";

/**
 * Two-column layout for Hệ thống giải. Left column hosts the in-page menu
 * (`AwardsNav` — Client island, scroll-tracking); right column hosts the six
 * detail cards. The menu sticks to the viewport top while the cards scroll
 * (spec § "left-side sticky navigation menu" + plan Phase 2/4 sticky note).
 * Below `lg:`, the menu is hidden — narrow viewports rely on native scroll
 * only (Q-HTG4).
 *
 * The sticky offset reads from `--saa-header-scroll-margin` (currently `0px`
 * because the deployed `Header` is `position: absolute` and scrolls away —
 * see plan §"Important header-positioning note"). If the Header is later
 * converted to sticky/fixed, only that CSS variable needs to change.
 */
export default function AwardsLayout({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="flex w-full max-w-[1152px] flex-col gap-20 lg:flex-row lg:items-start lg:justify-between">
      <div className="hidden shrink-0 lg:sticky lg:top-[var(--saa-header-scroll-margin)] lg:block">
        <AwardsNav locale={locale} />
      </div>
      <AwardsList locale={locale} />
    </section>
  );
}
