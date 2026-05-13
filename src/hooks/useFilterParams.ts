"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type FilterKey = "hashtag" | "dept";

const FILTER_KEYS: readonly FilterKey[] = ["hashtag", "dept"] as const;

/**
 * Phase 5 owner per Q-PLAN9 review — Phase 7 reuses the same hook for the
 * filter dropdowns. Reads `?hashtag=` and `?dept=` from `useSearchParams`,
 * exposes typed setters that call `router.replace` so navigation does not
 * push a new history entry on every chip click. `null` is the only way to
 * drop a param — passing an empty string would write `?hashtag=` and break
 * the Zod `.min(1)` guard on the server side.
 */
export function useFilterParams(): {
  hashtag: string | null;
  dept: string | null;
  setHashtag: (value: string | null) => void;
  setDepartment: (value: string | null) => void;
  clear: () => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hashtag = searchParams.get("hashtag");
  const dept = searchParams.get("dept");

  const replaceWith = useCallback(
    (next: Partial<Record<FilterKey, string | null>>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of FILTER_KEYS) {
        if (key in next) {
          const value = next[key];
          if (value === null || value === "") {
            params.delete(key);
          } else if (value !== undefined) {
            params.set(key, value);
          }
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setHashtag = useCallback(
    (value: string | null) => replaceWith({ hashtag: value }),
    [replaceWith],
  );
  const setDepartment = useCallback(
    (value: string | null) => replaceWith({ dept: value }),
    [replaceWith],
  );
  const clear = useCallback(
    () => replaceWith({ hashtag: null, dept: null }),
    [replaceWith],
  );

  return useMemo(
    () => ({ hashtag, dept, setHashtag, setDepartment, clear }),
    [hashtag, dept, setHashtag, setDepartment, clear],
  );
}
