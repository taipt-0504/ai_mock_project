"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import ProfilePreviewPopup from "@/src/components/sun-kudos/ProfilePreviewPopup";
import type { KudoAuthor } from "@/src/lib/kudos/types";
import type { SupportedLocale } from "@/src/lib/i18n/types";

type Props = {
  author: KudoAuthor;
  locale: SupportedLocale;
  children?: ReactNode;
};

/**
 * Avatar + name link wrapped in ProfilePreviewPopup. Hover dwell ≥ 300ms or
 * keyboard focus reveals the preview. Navigation target is the surveyed
 * Profile screen `w4WUvsJ9KI` (Phase 1 T005) — `/profile/{userId}`.
 */
export default function KudosAvatarLink({ author, locale, children }: Props) {
  return (
    <ProfilePreviewPopup author={author} locale={locale}>
      <Link
        href={`/profile/${author.id}`}
        className="flex flex-col items-center gap-3 focus-visible:outline-none"
      >
        {author.image ? (
          <Image
            src={author.image}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
            style={{ borderWidth: "1.869px", borderColor: "#FFFFFF", borderStyle: "solid" }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-16 w-16 shrink-0 rounded-full"
            style={{
              borderWidth: "1.869px",
              borderColor: "#FFFFFF",
              borderStyle: "solid",
              backgroundColor: "#EEEEEE",
            }}
          />
        )}
        {children ?? (
          <span className="text-center font-display text-base font-bold leading-6 tracking-[0.15px] text-[#00101A]">
            {author.name}
          </span>
        )}
      </Link>
    </ProfilePreviewPopup>
  );
}
