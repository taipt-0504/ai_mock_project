"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import KudosCard from "@/src/components/sun-kudos/KudosCard";
import { useInfiniteScroll } from "@/src/hooks/useInfiniteScroll";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";
import type { Kudo, KudoFeedPage } from "@/src/lib/kudos/types";

type Props = {
  initialItems: Kudo[];
  initialCursor: string | null;
  locale: SupportedLocale;
};

/**
 * Client island wrapping the All Kudos feed (Phase 5 T050). Owns the
 * paginated state: starts from the server-rendered initial page, then
 * fetches `/api/kudos?cursor=...` whenever the sentinel scrolls into view
 * (via useInfiniteScroll). The filter querystring is forwarded to the API
 * so backend filtering composes with the URL state managed by
 * useFilterParams (Phase 5 T048).
 */
export default function KudosFeedClient({
  initialItems,
  initialCursor,
  locale,
}: Props) {
  const [items, setItems] = useState<Kudo[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [error, setError] = useState<string | null>(null);
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  const [prevInitialCursor, setPrevInitialCursor] = useState(initialCursor);
  const searchParams = useSearchParams();

  // Derived-state-during-render: when the server hands down a new initial
  // page (e.g. URL filter changed → page.tsx re-rendered), reset local
  // pagination without an effect. React 19 fast-paths a setState in render.
  if (
    prevInitialItems !== initialItems ||
    prevInitialCursor !== initialCursor
  ) {
    setPrevInitialItems(initialItems);
    setPrevInitialCursor(initialCursor);
    setItems(initialItems);
    setCursor(initialCursor);
    setError(null);
  }

  const onLoadMore = useCallback(async () => {
    if (cursor === null) return;
    const params = new URLSearchParams();
    params.set("cursor", cursor);
    const hashtag = searchParams.get("hashtag");
    const dept = searchParams.get("dept");
    if (hashtag) params.set("hashtag", hashtag);
    if (dept) params.set("dept", dept);
    try {
      const response = await fetch(`/api/kudos?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        setError("kudos.feed.load_more_failed");
        return;
      }
      const page = (await response.json()) as KudoFeedPage;
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setError(null);
    } catch {
      setError("kudos.feed.load_more_failed");
    }
  }, [cursor, searchParams]);

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore,
    hasMore: cursor !== null,
  });

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {items.map((kudo) => (
        <KudosCard key={kudo.id} kudo={kudo} locale={locale} />
      ))}
      <div
        ref={sentinelRef}
        data-testid="kudos-feed-sentinel"
        aria-hidden="true"
        className="h-1 w-full"
      />
      {cursor !== null ? (
        <p
          role="status"
          className="font-display text-sm font-bold leading-6 text-saa-kudos-time-fg"
        >
          {t("kudos.feed.loading_more", locale)}
        </p>
      ) : null}
      {error !== null ? (
        <p role="alert" className="font-display text-sm font-bold leading-6 text-saa-kudos-hashtag-fg">
          {t("kudos.feed.loading_more", locale)}
        </p>
      ) : null}
    </div>
  );
}
