import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
let currentSearch = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(currentSearch),
  usePathname: () => "/sun-kudos",
}));

import { useFilterParams } from "@/src/hooks/useFilterParams";

/**
 * Phase 5 T047 — useFilterParams TDD red. Owns the URL ↔ filter state
 * bridge for the Live Board (Phase 7 reuses for dropdowns per Q-PLAN9). It
 * MUST read the current `?hashtag=` / `?dept=` querystring on mount, expose
 * stable setters that round-trip through `router.replace(...)`, and treat
 * `null` as "remove this param".
 */
describe("useFilterParams — URL ↔ state bridge for the Kudos feed", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    currentSearch = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads the current hashtag and dept slugs from the URL", () => {
    currentSearch = "hashtag=dedicated&dept=engineering";
    const { result } = renderHook(() => useFilterParams());
    expect(result.current.hashtag).toBe("dedicated");
    expect(result.current.dept).toBe("engineering");
  });

  it("returns null when no filters are present", () => {
    currentSearch = "";
    const { result } = renderHook(() => useFilterParams());
    expect(result.current.hashtag).toBeNull();
    expect(result.current.dept).toBeNull();
  });

  it("setHashtag(value) preserves the dept param and replaces the URL", () => {
    currentSearch = "dept=engineering";
    const { result } = renderHook(() => useFilterParams());
    act(() => {
      result.current.setHashtag("dedicated");
    });
    expect(replaceMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith(
      "/sun-kudos?dept=engineering&hashtag=dedicated",
      { scroll: false },
    );
  });

  it("setHashtag(null) drops the hashtag param while keeping dept", () => {
    currentSearch = "hashtag=dedicated&dept=engineering";
    const { result } = renderHook(() => useFilterParams());
    act(() => {
      result.current.setHashtag(null);
    });
    expect(replaceMock).toHaveBeenCalledWith(
      "/sun-kudos?dept=engineering",
      { scroll: false },
    );
  });

  it("setDepartment(value) preserves hashtag and writes dept", () => {
    currentSearch = "hashtag=dedicated";
    const { result } = renderHook(() => useFilterParams());
    act(() => {
      result.current.setDepartment("design");
    });
    expect(replaceMock).toHaveBeenCalledWith(
      "/sun-kudos?hashtag=dedicated&dept=design",
      { scroll: false },
    );
  });

  it("clear() resets both filters and lands on the bare pathname", () => {
    currentSearch = "hashtag=dedicated&dept=engineering";
    const { result } = renderHook(() => useFilterParams());
    act(() => {
      result.current.clear();
    });
    expect(replaceMock).toHaveBeenCalledWith("/sun-kudos", { scroll: false });
  });
});
