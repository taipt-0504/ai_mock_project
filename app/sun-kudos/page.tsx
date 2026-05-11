import type { Session } from "next-auth";
import { redirect } from "next/navigation";

import KudosBoardLayout from "@/src/components/sun-kudos/KudosBoardLayout";
import { auth } from "@/src/lib/auth";
import { getSaaLocale } from "@/src/lib/cookies/saa-locale";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";
import { getUnreadCount } from "@/src/services/notification-service";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  hashtag?: string | string[];
  dept?: string | string[];
}>;

export default async function SunKudosPage({
  searchParams,
}: {
  searchParams?: SearchParams;
} = {}) {
  let session: Session | null = null;
  try {
    session = (await auth()) as Session | null;
  } catch (err) {
    logger.warn("auth.lookup-failed", {
      message: err instanceof Error ? err.message : "unknown",
      route: "/sun-kudos",
    });
  }

  if (!session?.user) {
    redirect("/login");
  }

  // Read filter slot for future Phase 5/7 use; intentionally unused at skeleton.
  if (searchParams) {
    await searchParams;
  }

  const userId = session.user.id;
  const [locale, unreadCount] = await Promise.all([
    getSaaLocale().catch((err) => {
      logger.warn("locale.cookie-read-failed", {
        message: err instanceof Error ? err.message : "unknown",
      });
      return DEFAULT_LOCALE as SupportedLocale;
    }),
    userId
      ? getUnreadCount(userId).catch((err) => {
          logger.warn("notifications.unread-count-failed", {
            message: err instanceof Error ? err.message : "unknown",
          });
          return 0;
        })
      : Promise.resolve(0),
  ]);

  return (
    <KudosBoardLayout
      locale={locale}
      userName={session.user.name}
      userImage={session.user.image}
      unreadCount={unreadCount}
    />
  );
}
