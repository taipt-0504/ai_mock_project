"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOutAction } from "@/src/actions/auth";
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
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
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
          className="absolute right-0 top-full z-30 mt-2 flex min-w-[133px] flex-col rounded-lg border border-saa-dropdown-border bg-saa-dropdown-surface p-1.5"
        >
          <Link
            href="/profile"
            role="menuitem"
            className="saa-profile-item flex w-full items-center gap-1 rounded px-4 py-4 font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg motion-safe:transition-[background-color,text-shadow]"
          >
            <span className="whitespace-nowrap">{t("home.profile.profile", locale)}</span>
            <Image
              src="/assets/home/icons/user.svg"
              alt=""
              width={24}
              height={24}
            />
          </Link>
          <form action={signOutAction} className="contents">
            <button
              type="submit"
              role="menuitem"
              className="saa-profile-item flex w-full items-center gap-1 rounded px-4 py-4 text-left font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg motion-safe:transition-[background-color,text-shadow]"
            >
              <span className="whitespace-nowrap">{t("home.profile.sign_out", locale)}</span>
              <Image
                src="/assets/home/icons/chevron-right.svg"
                alt=""
                width={24}
                height={24}
              />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
