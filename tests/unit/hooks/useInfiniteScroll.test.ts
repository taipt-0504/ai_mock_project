import { act, render, renderHook, waitFor } from "@testing-library/react";
import React, { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useInfiniteScroll } from "@/src/hooks/useInfiniteScroll";

/**
 * Phase 5 T045 — useInfiniteScroll TDD red. The hook is the core of the All
 * Kudos feed pagination loop (Phase 5 T050 client island). It MUST: (a) call
 * `onLoadMore` exactly once when the sentinel enters the viewport, (b) ignore
 * subsequent intersections until the in-flight promise resolves, (c) stop
 * observing when `hasMore` flips to false, (d) disconnect the observer on
 * unmount so navigations away from the feed don't leak listeners.
 */
describe("useInfiniteScroll — sentinel-driven pagination", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function mountWithSentinel(opts: Parameters<typeof useInfiniteScroll>[0]) {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children);
    return renderHook(
      (props: Parameters<typeof useInfiniteScroll>[0]) => {
        const refs = useRef<HTMLDivElement | null>(null);
        const hookResult = useInfiniteScroll(props);
        // Attach the returned ref to a real DOM node so observer.observe() has
        // a target to bind to (jsdom no-op observer + StubIntersectionObserver
        // still requires the ref to be non-null when our effect runs).
        if (hookResult.sentinelRef !== refs) {
          refs.current = document.createElement("div");
          hookResult.sentinelRef.current = refs.current;
        }
        return hookResult;
      },
      { initialProps: opts, wrapper },
    );
  }

  it("returns a stable sentinelRef object", () => {
    const onLoadMore = vi.fn();
    const { result } = mountWithSentinel({ onLoadMore, hasMore: true });
    expect(result.current.sentinelRef).toBeDefined();
    expect("current" in result.current.sentinelRef).toBe(true);
  });

  it("calls onLoadMore exactly once when the sentinel intersects + hasMore is true", async () => {
    const onLoadMore = vi.fn().mockResolvedValue(undefined);
    mountWithSentinel({ onLoadMore, hasMore: true });

    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  it("ignores repeat intersections while the previous onLoadMore is still in flight", async () => {
    let resolve!: () => void;
    const onLoadMore = vi.fn(
      () => new Promise<void>((r) => {
        resolve = r;
      }),
    );
    mountWithSentinel({ onLoadMore, hasMore: true });

    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });
    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });
    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      resolve();
    });

    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(2);
    });
  });

  it("does not call onLoadMore when hasMore is false", () => {
    const onLoadMore = vi.fn();
    mountWithSentinel({ onLoadMore, hasMore: false });

    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: true }]);
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("ignores intersections where isIntersecting=false", () => {
    const onLoadMore = vi.fn();
    mountWithSentinel({ onLoadMore, hasMore: true });

    act(() => {
      globalThis.__triggerIntersection([{ isIntersecting: false }]);
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("renders the sentinel via a wrapping component without throwing", () => {
    function Feed() {
      const { sentinelRef } = useInfiniteScroll({
        onLoadMore: vi.fn(),
        hasMore: true,
      });
      return React.createElement("div", { ref: sentinelRef, "data-testid": "sentinel" });
    }
    const { getByTestId } = render(React.createElement(Feed));
    expect(getByTestId("sentinel")).toBeInTheDocument();
  });
});
