import AwardCard from "@/src/components/home/AwardCard";
import { AWARDS } from "@/src/lib/awards/awards";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function AwardsGrid({ locale }: { locale: SupportedLocale }) {
  return (
    <ul
      role="list"
      className="grid w-full max-w-[1224px] grid-cols-1 gap-x-20 gap-y-20 sm:grid-cols-2 lg:grid-cols-3"
    >
      {AWARDS.map((award) => (
        <li key={award.id} className="flex justify-center lg:justify-start">
          <AwardCard award={award} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
