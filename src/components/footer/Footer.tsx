import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

/**
 * Footer (mms_D_Footer) — Server Component, non-interactive (FR-012),
 * fixed at the bottom of the Login viewport (FR-013).
 */
export default function Footer({ locale }: { locale: SupportedLocale }) {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center border-t border-saa-divider px-[90px] py-10">
      <p className="font-display-alt text-base font-bold leading-6 text-saa-page-fg">
        {t("footer.copyright", locale)}
      </p>
    </footer>
  );
}
