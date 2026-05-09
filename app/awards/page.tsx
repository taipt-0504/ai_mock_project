import type { Session } from "next-auth";
import Image from "next/image";
import { redirect } from "next/navigation";

import AwardsLayout from "@/src/components/awards/AwardsLayout";
import Footer from "@/src/components/home/Footer";
import KudosBlock from "@/src/components/home/KudosBlock";
import NavLinks from "@/src/components/home/NavLinks";
import NotificationBell from "@/src/components/home/NotificationBell";
import ProfileButton from "@/src/components/home/ProfileButton";
import WidgetButton from "@/src/components/home/WidgetButton";
import Header from "@/src/components/header/Header";
import { auth } from "@/src/lib/auth";
import { getSaaLocale } from "@/src/lib/cookies/saa-locale";
import { t } from "@/src/lib/i18n";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";
import { getUnreadCount } from "@/src/services/notification-service";

export const dynamic = "force-dynamic";

const CURRENT_PATH = "/awards";

export default async function AwardsPage() {
  let session: Session | null = null;
  try {
    session = (await auth()) as Session | null;
  } catch (err) {
    logger.warn("auth.lookup-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  if (!session?.user) {
    redirect("/login");
  }

  let locale: SupportedLocale = DEFAULT_LOCALE;
  try {
    locale = await getSaaLocale();
  } catch (err) {
    logger.warn("locale.cookie-read-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  let unreadCount = 0;
  const userId = session.user.id;
  try {
    if (userId) {
      unreadCount = await getUnreadCount(userId);
    }
  } catch (err) {
    logger.warn("notifications.unread-count-failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-saa-page text-saa-page-fg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1392px]"
      >
        <Image
          src="/assets/home/images/key-visual.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="saa-overlay-fade-left absolute inset-0" />
        <div className="saa-overlay-fade-bottom absolute inset-x-0 bottom-0 h-[800px]" />
      </div>

      <Header
        locale={locale}
        isAuthenticated={true}
        logoHref="/"
        nav={<NavLinks currentPath={CURRENT_PATH} locale={locale} />}
        notification={
          <NotificationBell locale={locale} unreadCount={unreadCount} />
        }
        profileMenu={
          <ProfileButton
            locale={locale}
            name={session.user.name}
            image={session.user.image}
          />
        }
      />

      <div className="relative z-10 flex flex-col items-center gap-[120px] px-36 pb-24 pt-[184px]">
        <Keyvisual />
        <AwardsTitleBlock locale={locale} />
        <AwardsLayout locale={locale} />
        <KudosBlock locale={locale} />
      </div>

      <Footer currentPath={CURRENT_PATH} locale={locale} />
      <WidgetButton locale={locale} />
    </main>
  );
}

function Keyvisual() {
  return (
    <div className="flex w-full max-w-[1152px] items-start">
      <Image
        src="/assets/home/images/root-further-logo.png"
        alt="ROOT FURTHER"
        width={338}
        height={150}
        priority
        className="h-[150px] w-[338px] object-contain"
      />
    </div>
  );
}

function AwardsTitleBlock({ locale }: { locale: SupportedLocale }) {
  return (
    <header className="flex w-full max-w-[1152px] flex-col items-stretch gap-4">
      <p className="text-center font-display text-2xl font-bold leading-8 text-saa-page-fg">
        {t("awards.detail.title_caption", locale)}
      </p>
      <span aria-hidden="true" className="h-px w-full bg-saa-divider" />
      <h1 className="text-center font-display text-[57px] font-bold leading-[64px] tracking-[-0.25px] text-saa-button-primary">
        {t("awards.detail.title_heading", locale)}
      </h1>
    </header>
  );
}
