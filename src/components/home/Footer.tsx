import Image from "next/image";
import Link from "next/link";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

type FooterLink = {
  href: string;
  labelKey: string;
};

const FOOTER_LINKS: ReadonlyArray<FooterLink> = [
  { href: "/", labelKey: "home.footer.about" },
  { href: "/awards", labelKey: "home.footer.awards" },
  { href: "/sun-kudos", labelKey: "home.footer.kudos" },
  { href: "/general-rules", labelKey: "home.footer.general_rules" },
];

const ACTIVE_LINK_CLASS =
  "flex items-center rounded px-4 py-4 font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg bg-saa-button-primary/10 [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]";

const INACTIVE_LINK_CLASS =
  "flex items-center px-4 py-4 font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg motion-safe:transition-colors hover:text-saa-button-primary";

export default function Footer({
  currentPath,
  locale,
}: {
  currentPath: string;
  locale: SupportedLocale;
}) {
  return (
    <footer className="flex w-full items-center justify-between border-t border-saa-divider bg-saa-footer-bg px-[90px] py-10">
      <div className="flex flex-row items-center gap-20">
        <Link href="/" className="flex h-16 w-[69px] items-center">
          <Image
            src="/assets/home/logos/footer-logo.png"
            alt="Sun Annual Awards"
            width={69}
            height={64}
          />
        </Link>
        <nav aria-label="Footer" className="flex flex-row items-center gap-12">
          {FOOTER_LINKS.map((item) => {
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
      </div>
      <p className="font-display-alt text-base font-bold leading-6 text-saa-page-fg">
        {t("footer.copyright", locale)}
      </p>
    </footer>
  );
}
