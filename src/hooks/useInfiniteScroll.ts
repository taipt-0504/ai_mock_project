"use client";

import { useEffect, useRef } from "react";

type Options = {
  onLoadMore: () => Promise<unknown> | unknown;
  hasMore: boolean;
  rootMargin?: string;
};

/**
 * Sentinel-driven infinite scroll. Attach `sentinelRef` to a zero-height div
 * placed after the last rendered item. When that div enters the viewport,
 * `onLoadMore` is invoked once; subsequent intersections are ignored until
 * the previous promise resolves so concurrent network calls cannot pile up.
 * Observer disconnects on unmount and when `hasMore` flips to false.
 */
export function useInfiniteScroll(options: Options): {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
} {
  const { onLoadMore, hasMore, rootMargin = "200px" } = options;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const inFlight = useRef(false);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!hasMore) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (!visible || inFlight.current) return;
        inFlight.current = true;
        Promise.resolve(onLoadMoreRef.current()).finally(() => {
          inFlight.current = false;
        });
      },
      { rootMargin },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, rootMargin]);

  return { sentinelRef };
}
