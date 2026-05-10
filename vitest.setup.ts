import "@testing-library/jest-dom/vitest";

// Point any DB-touching test at the dedicated test database. Must run before
// any test file's imports so the Prisma singleton (`src/lib/prisma`) reads the
// overridden value at first construction.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

// Prelaunch gate (FR-009 — fail closed when null). Default to "gate disabled"
// for the Vitest suite so existing Login + Homepage tests continue to assert
// passthrough behavior. Tests that need to exercise the gate-active branch
// MUST opt in explicitly via `vi.stubEnv("SAA_LAUNCH_AT", "<future ISO>")`
// + `vi.resetModules()` (see tests/integration/prelaunch/*).
if (!process.env.SAA_LAUNCH_AT) {
  process.env.SAA_LAUNCH_AT = "2000-01-01T00:00:00Z";
}

// scrollIntoView stub — jsdom does not implement layout, so this is a no-op.
// Components that call `el.scrollIntoView({ ... })` will not throw under tests.
if (
  typeof Element !== "undefined" &&
  typeof Element.prototype.scrollIntoView === "undefined"
) {
  Element.prototype.scrollIntoView = function () {};
}

// matchMedia stub — jsdom does not implement it. Default reports `matches:
// false` for every query; tests can override per-suite via `vi.spyOn` or by
// reassigning `window.matchMedia`.
if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// IntersectionObserver stub — jsdom does not implement it. Inert by default
// (observe / unobserve / disconnect are no-ops). Awards tests opt-in to
// driving callbacks via `globalThis.__triggerIntersection(entries)`, which
// fires every live observer's callback with the supplied entries.
type TestIntersectionEntry = Partial<IntersectionObserverEntry>;
type TestIntersectionCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void;

const liveObservers = new Set<{
  callback: TestIntersectionCallback;
  instance: IntersectionObserver;
}>();

class StubIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(private readonly callback: TestIntersectionCallback) {
    liveObservers.add({ callback, instance: this });
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    for (const entry of liveObservers) {
      if (entry.instance === this) {
        liveObservers.delete(entry);
        return;
      }
    }
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver })
  .IntersectionObserver = StubIntersectionObserver as unknown as typeof IntersectionObserver;

declare global {
  var __triggerIntersection: (entries: TestIntersectionEntry[]) => void;
}

globalThis.__triggerIntersection = (entries: TestIntersectionEntry[]): void => {
  const fullEntries = entries.map(
    (e) =>
      ({
        time: 0,
        target: e.target ?? document.body,
        isIntersecting: e.isIntersecting ?? false,
        intersectionRatio: e.intersectionRatio ?? 0,
        boundingClientRect: e.boundingClientRect ?? new DOMRectReadOnly(),
        intersectionRect: e.intersectionRect ?? new DOMRectReadOnly(),
        rootBounds: e.rootBounds ?? null,
        ...e,
      }) as IntersectionObserverEntry,
  );
  for (const { callback, instance } of liveObservers) {
    callback(fullEntries, instance);
  }
};
