import type { ReactNode } from "react";

import LanguageSelector from "@/src/components/header/LanguageSelector";
import Logo from "@/src/components/header/Logo";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function Header({
  locale,
  isAuthenticated = false,
  nav,
  notification,
  profileMenu,
  logoHref,
}: {
  locale: SupportedLocale;
  isAuthenticated?: boolean;
  nav?: ReactNode;
  notification?: ReactNode;
  profileMenu?: ReactNode;
  logoHref?: string;
}) {
  const hasFullChrome = Boolean(nav || notification || profileMenu);

  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-20 items-center justify-between bg-saa-header px-36 py-3">
      <div className="flex flex-row items-center gap-16">
        <Logo href={logoHref} />
        {nav}
      </div>
      <div className="flex flex-row items-center gap-4">
        {hasFullChrome ? notification : null}
        <LanguageSelector locale={locale} isAuthenticated={isAuthenticated} />
        {hasFullChrome ? profileMenu : null}
      </div>
    </header>
  );
}
