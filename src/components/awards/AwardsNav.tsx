"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { AWARDS, type AwardSlug } from "@/src/lib/awards/awards";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

const AWARD_SLUGS: ReadonlyArray<AwardSlug> = AWARDS.map((a) => a.slug);
const DEFAULT_SLUG: AwardSlug = "top-talent";

const ACTIVE_LINK_CLASS =
  "block border-b border-saa-button-primary px-4 py-4 font-display text-sm font-bold leading-5 tracking-[0.25px] text-saa-button-primary [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]";

const INACTIVE_LINK_CLASS =
  "block rounded-md border-b border-transparent px-4 py-4 font-display text-sm font-bold leading-5 tracking-[0.25px] text-saa-page-fg motion-safe:transition-colors hover:bg-white/5";

function isAwardSlug(value: string): value is AwardSlug {
  return (AWARD_SLUGS as ReadonlyArray<string>).includes(value);
}

function slugFromHash(hash: string): AwardSlug {
  const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
  return isAwardSlug(cleaned) ? cleaned : DEFAULT_SLUG;
}

function subscribeHash(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot(): AwardSlug {
  return slugFromHash(window.location.hash);
}

function getHashServerSnapshot(): AwardSlug {
  return DEFAULT_SLUG;
}

export default function AwardsNav({ locale }: { locale: SupportedLocale }) {
  const hashSlug = useSyncExternalStore(
    subscribeHash,
    getHashSnapshot,
    getHashServerSnapshot,
  );
  const [scrolledSlug, setScrolledSlug] = useState<AwardSlug | null>(null);
  const activeSlug: AwardSlug = scrolledSlug ?? hashSlug;

  useEffect(() => {
    const reset = () => setScrolledSlug(null);
    window.addEventListener("hashchange", reset);
    return () => window.removeEventListener("hashchange", reset);
  }, []);

  useEffect(() => {
    const headerOffset =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--saa-header-scroll-margin")
        .trim() || "0px";
    const visible = new Map<AwardSlug, IntersectionObserverEntry>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = entry.target.id;
          if (!isAwardSlug(slug)) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            visible.set(slug, entry);
          } else {
            visible.delete(slug);
          }
        }
        if (visible.size === 0) return;
        let topSlug: AwardSlug | null = null;
        let topY = Number.POSITIVE_INFINITY;
        for (const [slug, entry] of visible) {
          const top = entry.boundingClientRect.top;
          if (top < topY) {
            topY = top;
            topSlug = slug;
          }
        }
        if (topSlug !== null) setScrolledSlug(topSlug);
      },
      { rootMargin: `-${headerOffset} 0px 0px 0px`, threshold: [0.5] },
    );

    for (const slug of AWARD_SLUGS) {
      const el = document.getElementById(slug);
      if (el !== null) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      const slug = event.currentTarget.dataset.slug;
      if (slug === undefined || !isAwardSlug(slug)) return;
      const target = document.getElementById(slug);
      if (target === null) return;
      event.preventDefault();
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      window.history.replaceState(null, "", `#${slug}`);
      setScrolledSlug(slug);
    },
    [],
  );

  return (
    <nav
      aria-label="Awards categories"
      className="flex w-[178px] flex-col gap-4"
    >
      {AWARDS.map((award) => {
        const isActive = activeSlug === award.slug;
        return (
          <a
            key={award.slug}
            href={`#${award.slug}`}
            data-slug={award.slug}
            aria-current={isActive ? "true" : undefined}
            onClick={handleClick}
            className={isActive ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS}
          >
            {t(award.titleKey, locale)}
          </a>
        );
      })}
    </nav>
  );
}
