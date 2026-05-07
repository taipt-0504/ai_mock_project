import Image from "next/image";

import Countdown from "@/src/components/home/Countdown";
import EventInfo from "@/src/components/home/EventInfo";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function Hero({
  eventStart,
  locale,
}: {
  eventStart: Date | null;
  locale: SupportedLocale;
}) {
  return (
    <section className="flex w-full max-w-[1224px] flex-col items-start gap-10">
      <div className="flex h-[200px] items-start">
        <Image
          src="/assets/home/images/root-further-logo.png"
          alt="ROOT FURTHER"
          width={451}
          height={200}
          priority
        />
      </div>
      <div className="flex w-full flex-col items-start gap-4">
        <Countdown eventStart={eventStart} locale={locale} />
        <EventInfo locale={locale} />
      </div>
    </section>
  );
}
