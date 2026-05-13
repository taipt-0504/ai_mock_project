"use client";

import { useFilterParams } from "@/src/hooks/useFilterParams";
import type { Hashtag } from "@/src/lib/kudos/types";

type Props = {
  hashtags: Hashtag[];
};

/**
 * Hashtag chips row inside KudosCard (Phase 5 T055 wiring). Each chip click
 * sets `?hashtag={slug}` via useFilterParams so the feed re-filters in
 * place. Server-side render emits the slug as a button label so screen
 * readers see the same chips even with JS off.
 */
export default function KudoHashtagChips({ hashtags }: Props) {
  const { setHashtag } = useFilterParams();
  if (hashtags.length === 0) return null;

  return (
    <div className="flex flex-row flex-wrap items-center gap-3 self-stretch font-display text-base font-bold leading-6 tracking-[0.5px]">
      {hashtags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => setHashtag(tag.slug)}
          className="rounded-md text-saa-kudos-hashtag-fg transition-colors hover:text-saa-button-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-button-primary focus-visible:ring-offset-2 focus-visible:ring-offset-saa-kudos-card"
        >
          #{tag.name}
        </button>
      ))}
    </div>
  );
}
