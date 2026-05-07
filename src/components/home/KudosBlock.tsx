import Image from "next/image";
import Link from "next/link";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function KudosBlock({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="flex w-full max-w-[1224px] justify-center">
      <div className="relative flex h-[500px] w-full max-w-[1120px] items-center overflow-hidden rounded-2xl bg-[#0F0F0F]">
        <Image
          src="/assets/home/images/kudos-background.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="1120px"
          className="object-cover opacity-90"
        />
        <div className="relative z-10 flex w-full flex-row items-center justify-between px-16">
          <div className="flex w-[457px] flex-col items-start gap-8">
            <div className="flex w-full flex-col items-start gap-4">
              <p className="font-display text-2xl font-bold leading-8 text-saa-page-fg">
                {t("home.kudos.label", locale)}
              </p>
              <h2 className="font-display text-[57px] font-bold leading-[64px] tracking-[-0.25px] text-saa-button-primary">
                {t("home.kudos.title", locale)}
              </h2>
              <p className="whitespace-pre-line text-justify font-display text-base font-bold leading-6 tracking-[0.5px] text-saa-page-fg">
                {t("home.kudos.description", locale)}
              </p>
            </div>
            <Link
              href="/sun-kudos"
              className="flex h-14 items-center gap-2 rounded-md bg-saa-button-primary px-4 py-4 font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-button-primary-fg motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
            >
              <span>{t("home.kudos.detail_button", locale)}</span>
              <Image
                src="/assets/home/icons/arrow-up-right.svg"
                alt=""
                width={24}
                height={24}
                aria-hidden="true"
                className="brightness-0"
              />
            </Link>
          </div>
          <div className="flex h-[72px] w-[364px] items-center justify-end">
            <Image
              src="/assets/home/images/kudos-logo.svg"
              alt="Sun* Kudos"
              width={364}
              height={72}
              className="h-auto w-full max-w-[364px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
