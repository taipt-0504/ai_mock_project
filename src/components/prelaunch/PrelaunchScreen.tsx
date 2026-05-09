import Image from "next/image";

import Countdown from "@/src/components/home/Countdown";
import PrelaunchAutoExit from "@/src/components/prelaunch/PrelaunchAutoExit";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function PrelaunchScreen({
  launchAt,
  locale,
}: {
  launchAt: Date | null;
  locale: SupportedLocale;
}) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-saa-page text-saa-page-fg">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/assets/prelaunch/images/key-visual.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="saa-overlay-prelaunch-cover absolute inset-0" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-36 py-24 text-center">
        <Countdown
          eventStart={launchAt}
          locale={locale}
          subtitleAs="h1"
          subtitleKey="prelaunch.heading"
        />
        <PrelaunchAutoExit launchAt={launchAt} />
      </div>
    </main>
  );
}
