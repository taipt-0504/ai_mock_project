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
    const onHashChange = () => {
      const cleaned = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      if (isAwardSlug(cleaned)) {
        document
          .getElementById(cleaned)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      }
      setScrolledSlug(null);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const headerOffset =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--saa-header-scroll-margin")
        .trim() || "0px";

    const recomputeTopmost = () => {
      const viewportH = window.innerHeight;
      let topSlug: AwardSlug | null = null;
      let bestTop = Number.POSITIVE_INFINITY;
      for (const slug of AWARD_SLUGS) {
        const el = document.getElementById(slug);
        if (el === null) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top < 0 || rect.top >= viewportH) continue;
        if (rect.top < bestTop) {
          bestTop = rect.top;
          topSlug = slug;
        }
      }
      if (topSlug === null) {
        for (const slug of AWARD_SLUGS) {
          const el = document.getElementById(slug);
          if (el === null) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top < 0 && rect.bottom > 0) {
            topSlug = slug;
            break;
          }
        }
      }
      if (topSlug !== null) setScrolledSlug(topSlug);
    };

    const observer = new IntersectionObserver(recomputeTopmost, {
      rootMargin: `-${headerOffset} 0px 0px 0px`,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

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
