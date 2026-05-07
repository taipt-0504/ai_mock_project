import Image from "next/image";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function RootFurtherEssay({
  locale,
}: {
  locale: SupportedLocale;
}) {
  return (
    <section className="flex w-full max-w-[1152px] flex-col items-center gap-8 rounded-lg px-26 py-30">
      <div
        aria-label="ROOT FURTHER"
        className="relative flex h-[134px] w-[290px] flex-col items-end"
      >
        <Image
          src="/assets/home/images/root-text.png"
          alt=""
          aria-hidden="true"
          width={189}
          height={67}
        />
        <Image
          src="/assets/home/images/further-text.png"
          alt=""
          aria-hidden="true"
          width={290}
          height={67}
        />
      </div>
      <p className="w-full text-justify font-display text-2xl font-bold leading-8 text-saa-page-fg">
        {t("home.essay.paragraph1", locale)}
      </p>
      <p className="w-full text-justify font-display text-2xl font-bold leading-8 text-saa-page-fg">
        {t("home.essay.paragraph2", locale)}
      </p>
      <blockquote className="w-full text-center font-display text-xl font-bold leading-8 text-saa-page-fg">
        {t("home.essay.quote", locale)}
      </blockquote>
      <p className="w-full text-justify font-display text-2xl font-bold leading-8 text-saa-page-fg">
        {t("home.essay.paragraph3", locale)}
      </p>
    </section>
  );
}
