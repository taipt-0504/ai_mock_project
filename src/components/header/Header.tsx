import LanguageSelector from "@/src/components/header/LanguageSelector";
import Logo from "@/src/components/header/Logo";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function Header({
  locale,
  isAuthenticated = false,
}: {
  locale: SupportedLocale;
  isAuthenticated?: boolean;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-20 items-center justify-between bg-saa-header px-36 py-3">
      <Logo />
      <LanguageSelector locale={locale} isAuthenticated={isAuthenticated} />
    </header>
  );
}
