import type { Session } from "next-auth";
import Image from "next/image";
import { redirect } from "next/navigation";

import AwardsGrid from "@/src/components/home/AwardsGrid";
import AwardsSectionHeader from "@/src/components/home/AwardsSectionHeader";
import CTAButtons from "@/src/components/home/CTAButtons";
import Footer from "@/src/components/home/Footer";
import Hero from "@/src/components/home/Hero";
import KudosBlock from "@/src/components/home/KudosBlock";
import NavLinks from "@/src/components/home/NavLinks";
import NotificationBell from "@/src/components/home/NotificationBell";
import ProfileButton from "@/src/components/home/ProfileButton";
import RootFurtherEssay from "@/src/components/home/RootFurtherEssay";
import WidgetButton from "@/src/components/home/WidgetButton";
import Header from "@/src/components/header/Header";
import { auth } from "@/src/lib/auth";
import { config } from "@/src/lib/config";
import { getSaaLocale } from "@/src/lib/cookies/saa-locale";
import { parseEventStart } from "@/src/lib/event/event-config";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";
import { getUnreadCount } from "@/src/services/notification-service";

export const dynamic = "force-dynamic";

const CURRENT_PATH = "/";

export default async function Home() {
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

  const eventStart = parseEventStart(config.SAA_EVENT_START_AT);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-saa-page text-saa-page-fg">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1392px]">
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

      <div className="relative z-10 flex flex-col items-center gap-20 px-36 pb-20 pt-[184px]">
        <div className="flex w-full max-w-[1224px] flex-col items-start gap-10">
          <Hero eventStart={eventStart} locale={locale} />
          <CTAButtons locale={locale} />
        </div>

        <RootFurtherEssay locale={locale} />

        <div className="flex w-full max-w-[1224px] flex-col items-start gap-20">
          <AwardsSectionHeader locale={locale} />
          <AwardsGrid locale={locale} />
        </div>

        <KudosBlock locale={locale} />
      </div>

      <Footer currentPath={CURRENT_PATH} locale={locale} />
      <WidgetButton locale={locale} />
    </main>
  );
}
