import Image from "next/image";

import Footer from "@/src/components/home/Footer";
import NavLinks from "@/src/components/home/NavLinks";
import NotificationBell from "@/src/components/home/NotificationBell";
import ProfileButton from "@/src/components/home/ProfileButton";
import Header from "@/src/components/header/Header";
import KudosCreateInput from "@/src/components/sun-kudos/KudosCreateInput";
import type { SupportedLocale } from "@/src/lib/i18n/types";

const CURRENT_PATH = "/sun-kudos";

type Props = {
  locale: SupportedLocale;
  userName?: string | null;
  userImage?: string | null;
  unreadCount: number;
};

/**
 * Phase 2 skeleton for the Sun* Kudos Live Board. Mounts the global Header
 * and Footer plus six named slot regions. Each feature phase fills its slot
 * in place — Phase 4 (write input), Phase 5 (feed), Phase 6 (heart, via
 * KudosCard), Phase 7 (filters + highlight), Phase 8 (sidebar), Phase 9
 * (Spotlight). Styling stays intentionally light until feature phases attach
 * pixel-accurate components against Figma.
 */
export default function KudosBoardLayout({
  locale,
  userName,
  userImage,
  unreadCount,
}: Props) {
  return (
    <main className="relative min-h-screen w-full overflow-x-clip bg-saa-page text-saa-page-fg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[512px]"
      >
        <Image
          src="/assets/sun-kudos/illustrations/kv-background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
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
            name={userName ?? null}
            image={userImage ?? null}
          />
        }
      />

      <div className="relative z-10 flex flex-col items-center gap-[120px] px-36 pb-[120px] pt-[184px]">
        <section
          aria-label="Viết Kudos"
          data-testid="kudos-write-input-slot"
          className="flex w-full max-w-[1152px] flex-col items-center gap-10"
        >
          <KudosCreateInput locale={locale} />
        </section>

        <section
          aria-label="Bộ lọc Kudos"
          data-testid="kudos-filter-slot"
          className="flex w-full max-w-[1152px] flex-row items-center gap-4"
        />

        <section
          aria-labelledby="kudos-highlight-heading"
          data-testid="kudos-highlight-slot"
          className="flex w-full max-w-[1152px] flex-col gap-10"
        >
          <h2 id="kudos-highlight-heading" className="sr-only">
            Highlight Kudos
          </h2>
        </section>

        <section
          aria-labelledby="kudos-spotlight-heading"
          data-testid="kudos-spotlight-slot"
          className="flex w-full max-w-[1152px] flex-col gap-10"
        >
          <h2 id="kudos-spotlight-heading" className="sr-only">
            Spotlight
          </h2>
        </section>

        <div className="flex w-full max-w-[1152px] flex-col gap-20 lg:flex-row lg:items-start lg:justify-between">
          <section
            aria-labelledby="kudos-feed-heading"
            data-testid="kudos-feed-slot"
            className="flex w-full flex-col gap-6 lg:flex-1"
          >
            <h2 id="kudos-feed-heading" className="sr-only">
              All Kudos
            </h2>
          </section>

          <aside
            aria-labelledby="kudos-sidebar-heading"
            data-testid="kudos-sidebar-slot"
            className="flex w-full shrink-0 flex-col gap-10 lg:w-[336px]"
          >
            <h2 id="kudos-sidebar-heading" className="sr-only">
              Thống kê và xếp hạng
            </h2>
          </aside>
        </div>
      </div>

      <Footer currentPath={CURRENT_PATH} locale={locale} />
    </main>
  );
}
