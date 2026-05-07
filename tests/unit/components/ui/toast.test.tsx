import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Toaster from "@/src/components/ui/Toaster";
import { toast } from "@/src/components/ui/toast";

describe("toast primitive + Toaster", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("toast() is a no-op when no Toaster is mounted (no throw, no console errors)", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => {
      toast("orphan message");
      toast("another orphan", { variant: "error", durationMs: 1000 });
    }).not.toThrow();

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("Toaster renders a queued message and auto-dismisses after durationMs", () => {
    render(<Toaster />);

    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();

    act(() => {
      toast("Saved!", { durationMs: 2_000 });
    });

    expect(screen.getByText("Saved!")).toBeInTheDocument();

    // Just before the duration elapses the toast is still on screen.
    act(() => {
      vi.advanceTimersByTime(1_999);
    });
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    // After the duration elapses the toast disappears.
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });

  it("queues multiple rapid calls — each toast renders simultaneously", () => {
    render(<Toaster />);

    act(() => {
      toast("first", { durationMs: 5_000 });
      toast("second", { durationMs: 5_000 });
      toast("third", { durationMs: 5_000 });
    });

    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
    expect(screen.getByText("third")).toBeInTheDocument();
  });

  it("renders the error variant with distinct styling", () => {
    render(<Toaster />);

    act(() => {
      toast("Something failed", { variant: "error", durationMs: 5_000 });
    });

    const message = screen.getByText("Something failed");
    // The Toaster wraps each entry in a div whose class encodes the variant.
    expect(message.className).toMatch(/red/);
  });
});
