import Link from "next/link";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

type NavItem = {
  href: string;
  labelKey: string;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/", labelKey: "home.nav.about" },
  { href: "/awards", labelKey: "home.nav.awards" },
  { href: "/sun-kudos", labelKey: "home.nav.kudos" },
];

const ACTIVE_LINK_CLASS =
  "flex items-center gap-1 border-b border-saa-button-primary px-4 py-4 font-display text-sm font-bold leading-5 tracking-[0.1px] text-saa-button-primary [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]";

const INACTIVE_LINK_CLASS =
  "flex items-center gap-1 rounded-md px-4 py-4 font-display text-sm font-bold leading-5 tracking-[0.1px] text-saa-page-fg motion-safe:transition-colors hover:bg-white/5";

export default function NavLinks({
  currentPath,
  locale,
}: {
  currentPath: string;
  locale: SupportedLocale;
}) {
  return (
    <nav aria-label="Primary" className="flex flex-row items-center gap-6">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === currentPath;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={isActive ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS}
          >
            {t(item.labelKey, locale)}
          </Link>
        );
      })}
    </nav>
  );
}
