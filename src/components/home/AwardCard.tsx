import Image from "next/image";
import Link from "next/link";

import { AWARD_BG_ASSET, type Award } from "@/src/lib/awards/awards";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function AwardCard({
  award,
  locale,
}: {
  award: Award;
  locale: SupportedLocale;
}) {
  return (
    <Link
      href={`/awards#${award.slug}`}
      className="group flex w-[336px] flex-col items-start gap-6 motion-safe:transition-transform motion-safe:hover:-translate-y-1"
    >
      <div className="relative h-[336px] w-[336px] overflow-hidden rounded-3xl border border-saa-button-primary [box-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]">
        <Image
          src={AWARD_BG_ASSET}
          alt=""
          aria-hidden="true"
          fill
          sizes="336px"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={award.labelAsset}
            alt={t(award.titleKey, locale)}
            width={award.labelWidth}
            height={award.labelHeight}
            className="object-contain"
          />
        </div>
      </div>
      <div className="flex w-full flex-col gap-1">
        <h3 className="font-display text-2xl font-normal leading-8 text-saa-button-primary">
          {t(award.titleKey, locale)}
        </h3>
        <p className="line-clamp-2 font-display text-base font-normal leading-6 tracking-[0.5px] text-saa-page-fg">
          {t(award.descriptionKey, locale)}
        </p>
        <span className="mt-2 inline-flex w-fit items-center gap-1 py-4 font-display text-sm font-bold leading-5 tracking-[0.1px] text-saa-page-fg motion-safe:transition-colors group-hover:text-saa-button-primary">
          {t("home.awards.section.detail_button", locale)}
          <Image
            src="/assets/home/icons/arrow-up-right.svg"
            alt=""
            width={24}
            height={24}
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
