import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePreviewPopup from "@/src/components/sun-kudos/ProfilePreviewPopup";
import type { KudoAuthor } from "@/src/lib/kudos/types";

const author: KudoAuthor = {
  id: "sunner-1",
  name: "Phương Anh",
  image: null,
  title: "Senior Engineer",
  departmentId: "engineering",
};

/**
 * Phase 5 T053 — ProfilePreviewPopup TDD red. The popup is the linked Figma
 * frame `721:5827` rendered above the avatar/name when the cursor hovers ≥
 * 300ms or the trigger receives keyboard focus (FR-018). Hover release
 * before the dwell elapses MUST cancel the timer; Escape MUST dismiss the
 * popup when it was shown via focus (keyboard a11y alt).
 */
describe("ProfilePreviewPopup — hover/focus reveal for KudosCard avatars", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders the trigger children before any interaction (popup hidden)", () => {
    render(
      <ProfilePreviewPopup author={author} locale="vi-VN">
        <a href={`/profile/${author.id}`} data-testid="trigger">
          Phương Anh
        </a>
      </ProfilePreviewPopup>,
    );
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hovering for ≥ 300ms reveals the preview popup", () => {
    render(
      <ProfilePreviewPopup author={author} locale="vi-VN">
        <a href={`/profile/${author.id}`} data-testid="trigger">
          Phương Anh
        </a>
      </ProfilePreviewPopup>,
    );

    const wrapper = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Phương Anh");
  });

  it("hover release before 300ms cancels the timer and the popup never shows", () => {
    render(
      <ProfilePreviewPopup author={author} locale="vi-VN">
        <a href={`/profile/${author.id}`} data-testid="trigger">
          Phương Anh
        </a>
      </ProfilePreviewPopup>,
    );

    const wrapper = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    fireEvent.mouseLeave(wrapper);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("focus on the trigger reveals the popup immediately (FR-018 keyboard a11y)", () => {
    render(
      <ProfilePreviewPopup author={author} locale="vi-VN">
        <a href={`/profile/${author.id}`} data-testid="trigger">
          Phương Anh
        </a>
      </ProfilePreviewPopup>,
    );

    const wrapper = screen.getByTestId("trigger").parentElement!;
    fireEvent.focus(wrapper);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("Escape dismisses the popup when it was shown via focus", () => {
    render(
      <ProfilePreviewPopup author={author} locale="vi-VN">
        <a href={`/profile/${author.id}`} data-testid="trigger">
          Phương Anh
        </a>
      </ProfilePreviewPopup>,
    );

    const wrapper = screen.getByTestId("trigger").parentElement!;
    fireEvent.focus(wrapper);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.keyDown(wrapper, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
