import KudosFeedClient from "@/src/components/sun-kudos/KudosFeedClient";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";
import type { Kudo } from "@/src/lib/kudos/types";

type Props = {
  initialItems: Kudo[];
  initialCursor: string | null;
  locale: SupportedLocale;
};

/**
 * Server Component wrapper for the All Kudos feed (Phase 5 T049). Renders
 * the FR-020 empty-state directly so search engines + initial paint see the
 * message without waiting for the client island to hydrate. When there is
 * data, the client island takes over pagination.
 */
export default function KudosFeed({ initialItems, initialCursor, locale }: Props) {
  if (initialItems.length === 0) {
    return (
      <p
        role="status"
        className="w-full max-w-[680px] rounded-[24px] bg-saa-kudos-card-bg px-10 py-12 text-center font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-kudos-time-fg"
      >
        {t("kudos.feed.empty", locale)}
      </p>
    );
  }

  return (
    <KudosFeedClient
      initialItems={initialItems}
      initialCursor={initialCursor}
      locale={locale}
    />
  );
}
