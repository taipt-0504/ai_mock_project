"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  LOCALE_DISPLAY,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/src/lib/i18n/types";

const COOKIE_NAME = "saa_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1y, mirrors setSaaLocale.

type Props = {
  locale: SupportedLocale;
  /**
   * When true, the component POSTs the new locale to `/api/i18n/locale` so
   * `User.locale` stays in sync across devices. Unauthenticated visitors
   * persist via the `saa_locale` cookie only.
   */
  isAuthenticated?: boolean;
};

/**
 * FR-007 language selector. Disclosure pattern with keyboard navigation
 * (ArrowUp / ArrowDown / Enter / Escape), focus trap while open, and
 * click-outside-to-close. Selection is optimistic; for authenticated users
 * the result is reverted if `/api/i18n/locale` fails.
 */
export default function LanguageSelector({
  locale,
  isAuthenticated = false,
}: Props) {
  const router = useRouter();
  const menuId = useId();

  const [optimisticLocale, setOptimisticLocale] = useState<SupportedLocale>(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, SUPPORTED_LOCALES.indexOf(locale)),
  );

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Click-outside closes the menu.
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  // Move focus to the active menu item while open; back to the trigger on close.
  useEffect(() => {
    if (isOpen) {
      const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      );
      items?.[activeIndex]?.focus();
    }
  }, [isOpen, activeIndex]);

  const writeClientCookie = useCallback((target: SupportedLocale) => {
    document.cookie = `${COOKIE_NAME}=${target}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  const commit = useCallback(
    async (target: SupportedLocale) => {
      // FR-010: clicking the already-active row is a strict no-op — close menu only.
      if (target === optimisticLocale) {
        setIsOpen(false);
        return;
      }

      const previous = optimisticLocale;
      setOptimisticLocale(target);
      setIsOpen(false);
      writeClientCookie(target);
      router.refresh();

      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/i18n/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: target }),
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
      } catch {
        // Revert chip + cookie so the UI matches the persisted truth.
        setOptimisticLocale(previous);
        writeClientCookie(previous);
      }
    },
    [optimisticLocale, isAuthenticated, router, writeClientCookie],
  );

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % SUPPORTED_LOCALES.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (i) => (i - 1 + SUPPORTED_LOCALES.length) % SUPPORTED_LOCALES.length,
      );
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void commit(SUPPORTED_LOCALES[activeIndex]);
    }
  };

  const display = LOCALE_DISPLAY[optimisticLocale];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Language: ${display.chip}`}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className="flex h-14 w-[108px] items-center justify-between gap-0.5 rounded-sm p-4"
      >
        <span className="flex h-6 w-[53px] items-center gap-1">
          <Image src={display.flagAsset} alt="" width={24} height={24} />
          <span className="font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg">
            {display.chip}
          </span>
        </span>
        <Image
          src="/assets/header/icons/chevron-down.svg"
          alt=""
          width={24}
          height={24}
          className={
            isOpen
              ? "rotate-180 motion-safe:transition-transform"
              : "motion-safe:transition-transform"
          }
        />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Language"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-full z-20 mt-2 flex flex-col rounded-lg border border-saa-dropdown-border bg-saa-dropdown-surface p-1.5"
        >
          {SUPPORTED_LOCALES.map((option, index) => {
            const item = LOCALE_DISPLAY[option];
            const isCurrent = option === optimisticLocale;
            return (
              <button
                key={option}
                role="menuitem"
                type="button"
                aria-current={isCurrent ? "true" : undefined}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => void commit(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className="flex h-14 w-[110px] items-center gap-1 rounded-sm p-4 text-left font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg hover:bg-saa-button-primary/10 aria-[current=true]:bg-saa-button-primary/20"
              >
                <Image src={item.flagAsset} alt="" width={24} height={24} />
                <span>{item.chip}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
