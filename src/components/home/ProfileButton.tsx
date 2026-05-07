"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function ProfileButton({
  locale,
  name,
  image,
}: {
  locale: SupportedLocale;
  name?: string | null;
  image?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={name ?? t("home.profile.profile", locale)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-saa-dropdown-border bg-transparent motion-safe:transition-colors hover:bg-white/5"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <span className="font-display text-sm font-bold text-saa-page-fg">
            {initial}
          </span>
        )}
      </button>
      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 flex w-44 flex-col rounded-lg border border-saa-dropdown-border bg-saa-dropdown-surface p-1.5"
        >
          <Link
            href="/profile"
            role="menuitem"
            className="rounded px-3 py-2 font-display text-sm font-bold text-saa-page-fg motion-safe:transition-colors hover:bg-white/5"
          >
            {t("home.profile.profile", locale)}
          </Link>
          <form action="/api/auth/signout" method="post" className="contents">
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded px-3 py-2 text-left font-display text-sm font-bold text-saa-page-fg motion-safe:transition-colors hover:bg-white/5"
            >
              {t("home.profile.sign_out", locale)}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
