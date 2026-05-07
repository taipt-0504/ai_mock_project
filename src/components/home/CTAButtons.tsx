import Image from "next/image";
import Link from "next/link";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function CTAButtons({ locale }: { locale: SupportedLocale }) {
  return (
    <div className="flex flex-row items-start gap-10">
      <Link
        href="/awards"
        className="flex h-15 items-center gap-2 rounded-lg bg-saa-button-primary px-6 py-4 font-display text-[22px] font-bold leading-7 text-saa-button-primary-fg motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
      >
        <span>{t("home.cta.about_awards", locale)}</span>
        <Image
          src="/assets/home/icons/arrow-up-right.svg"
          alt=""
          width={24}
          height={24}
          aria-hidden="true"
          className="brightness-0"
        />
      </Link>
      <Link
        href="/sun-kudos"
        className="flex h-15 items-center gap-2 rounded-lg border border-saa-dropdown-border bg-saa-button-primary/10 px-6 py-4 font-display text-[22px] font-bold leading-7 text-saa-page-fg motion-safe:transition-colors motion-safe:hover:bg-saa-button-primary/20"
      >
        <span>{t("home.cta.about_kudos", locale)}</span>
        <Image
          src="/assets/home/icons/arrow-up-right.svg"
          alt=""
          width={24}
          height={24}
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
