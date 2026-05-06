import Image from "next/image";

import LoginButton from "@/src/components/login/LoginButton";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function HeroSection({ locale }: { locale: SupportedLocale }) {
  return (
    <section className="relative z-10 flex min-h-[845px] w-full flex-col items-start justify-center px-36 py-24">
      <div className="flex w-full max-w-[1152px] flex-col items-start justify-center gap-20">
        {/* B.1 — "ROOT FURTHER" key visual (rendered as image in Figma). */}
        <div className="flex flex-col items-start gap-6">
          <Image
            src="/assets/login/images/root-further.png"
            alt={t("program.title", locale)}
            width={451}
            height={200}
            priority
          />
        </div>
        {/* B.2 — description + B.3 — login button. */}
        <div className="flex flex-col items-start gap-6 pl-4">
          <p className="font-display text-xl font-bold leading-10 tracking-[0.5px] whitespace-pre-line text-saa-page-fg">
            {`${t("program.description1", locale)}\n${t("program.description2", locale)}`}
          </p>
          <LoginButton
            labels={{
              label: t("loginButton.label", locale),
              errorGeneric: t("loginButton.errorGeneric", locale),
              errorCookies: t("loginButton.errorCookies", locale),
              errorCancelled: t("loginButton.errorCancelled", locale),
            }}
          />
        </div>
      </div>
    </section>
  );
}
