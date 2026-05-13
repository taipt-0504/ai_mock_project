"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { KudoAuthor } from "@/src/lib/kudos/types";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

type Props = {
  author: KudoAuthor;
  locale: SupportedLocale;
  children: ReactNode;
};

const HOVER_DWELL_MS = 300;

/**
 * Hover/focus-revealed profile preview for KudosCard avatars (Phase 5 T054).
 * Hover dwell of 300ms before reveal so quick mouse traversals across the
 * feed don't pop a flurry of popups; keyboard focus reveals immediately so
 * keyboard users get the same affordance (FR-018 + Constitution III a11y).
 */
export default function ProfilePreviewPopup({ author, locale, children }: Props) {
  const [open, setOpen] = useState(false);
  const dwellTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (dwellTimer.current !== null) {
        window.clearTimeout(dwellTimer.current);
      }
    };
  }, []);

  const cancelDwell = () => {
    if (dwellTimer.current !== null) {
      window.clearTimeout(dwellTimer.current);
      dwellTimer.current = null;
    }
  };

  const handleMouseEnter = () => {
    cancelDwell();
    dwellTimer.current = window.setTimeout(() => {
      setOpen(true);
    }, HOVER_DWELL_MS);
  };

  const handleMouseLeave = () => {
    cancelDwell();
    setOpen(false);
  };

  const handleFocus = () => {
    cancelDwell();
    setOpen(true);
  };

  const handleBlur = () => {
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {children}
      {open ? (
        <div
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-2 w-[280px] -translate-x-1/2 rounded-2xl border border-saa-dropdown-border bg-saa-dropdown-surface p-4 text-left shadow-xl"
        >
          <div className="flex items-center gap-3">
            {author.image ? (
              <Image
                src={author.image}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-12 w-12 shrink-0 rounded-full border-2 border-white bg-saa-kudos-filter"
              />
            )}
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-display text-base font-bold leading-6 text-saa-page-fg">
                {author.name ?? t("kudos.profile_preview.title_default", locale)}
              </span>
              <span className="truncate font-display text-sm font-medium leading-5 text-saa-kudos-time-fg">
                {author.title ?? t("kudos.profile_preview.title_default", locale)}
              </span>
              <span className="truncate font-display text-sm font-medium leading-5 text-saa-kudos-time-fg">
                {author.departmentId ??
                  t("kudos.profile_preview.department_default", locale)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
