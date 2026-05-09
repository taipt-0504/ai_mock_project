import AwardDetailCard from "@/src/components/awards/AwardDetailCard";
import { AWARDS } from "@/src/lib/awards/awards";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function AwardsList({ locale }: { locale: SupportedLocale }) {
  return (
    <div className="flex w-full max-w-[856px] flex-col gap-20">
      {AWARDS.map((award) => (
        <AwardDetailCard award={award} locale={locale} key={award.id} />
      ))}
    </div>
  );
}
