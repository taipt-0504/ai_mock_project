import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import PrelaunchAutoExit from "@/src/components/prelaunch/PrelaunchAutoExit";

describe("PrelaunchAutoExit (Prelaunch US3 scenario 3)", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-08T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires router.refresh() exactly once after wall clock crosses launchAt", () => {
    const launchAt = new Date(Date.now() + 30_000); // +30s
    render(<PrelaunchAutoExit launchAt={launchAt} />);

    expect(refreshMock).not.toHaveBeenCalled();

    // Advance one full minute — interval fires, now > launchAt → refresh once.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);

    // Further ticks MUST NOT call refresh again (useRef guard + interval cleared).
    act(() => {
      vi.advanceTimersByTime(60_000 * 5);
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when launchAt is null", () => {
    render(<PrelaunchAutoExit launchAt={null} />);

    act(() => {
      vi.advanceTimersByTime(60_000 * 10);
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("is a no-op when launchAt is already past at mount time", () => {
    const launchAt = new Date(Date.now() - 60_000); // 1 minute ago
    render(<PrelaunchAutoExit launchAt={launchAt} />);

    act(() => {
      vi.advanceTimersByTime(60_000 * 10);
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("does NOT fire refresh while launchAt is still in the future", () => {
    const launchAt = new Date(Date.now() + 5 * 60_000); // +5m
    render(<PrelaunchAutoExit launchAt={launchAt} />);

    // After 1 tick (1m), still 4m to go — no refresh yet.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(refreshMock).not.toHaveBeenCalled();

    // Cross the boundary on the 5th tick.
    act(() => {
      vi.advanceTimersByTime(60_000 * 4);
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("returns null (no DOM output)", () => {
    const launchAt = new Date(Date.now() + 60_000);
    const { container } = render(<PrelaunchAutoExit launchAt={launchAt} />);
    expect(container.firstChild).toBeNull();
  });
});
