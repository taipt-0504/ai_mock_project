import Image from "next/image";
import Link from "next/link";

import KudoHashtagChips from "@/src/components/sun-kudos/KudoHashtagChips";
import KudoImageGallery from "@/src/components/sun-kudos/KudoImageGallery";
import KudosAvatarLink from "@/src/components/sun-kudos/KudosAvatarLink";
import { formatKudoTime } from "@/src/lib/kudos/format-kudo-time";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";
import type { Kudo } from "@/src/lib/kudos/types";

type Props = {
  kudo: Kudo;
  locale: SupportedLocale;
};

const HASHTAG_VISIBLE_CAP = 5;

/**
 * C.3 feed card — Server Component (Phase 5 T044). Composes the sender +
 * receiver avatar row, the timestamp, the content panel (5-line clamp), the
 * gallery, and the hashtag chip row. Interactive bits are delegated to
 * KudosAvatarLink + KudoHashtagChips + KudoImageGallery (Client islands).
 * The C.4 action bar (heart + copy link) lands in Phase 6 (T060+).
 */
export default function KudosCard({ kudo, locale }: Props) {
  const visibleHashtags = kudo.hashtags.slice(0, HASHTAG_VISIBLE_CAP);
  const overflowCount = Math.max(0, kudo.hashtags.length - HASHTAG_VISIBLE_CAP);
  const overflowLabel = t("kudos.card.hashtag_overflow", locale).replace(
    "{count}",
    String(overflowCount),
  );

  return (
    <article
      id={kudo.id}
      className="flex w-full max-w-[680px] flex-col gap-4 rounded-[24px] bg-saa-kudos-card pb-4 pl-10 pr-10 pt-10 text-[#00101A]"
    >
      <div className="flex w-full flex-row items-start justify-between gap-6">
        <KudosAvatarLink author={kudo.sender} locale={locale}>
          <span className="text-center font-display text-base font-bold leading-6 tracking-[0.15px] text-[#00101A]">
            {kudo.sender.name}
          </span>
        </KudosAvatarLink>
        <div className="flex h-[123px] items-center justify-center py-4">
          <Image
            src="/assets/sun-kudos/icons/send.svg"
            alt={t("kudos.card.send_icon_alt", locale)}
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </div>
        <KudosAvatarLink author={kudo.receiver} locale={locale}>
          <span className="text-center font-display text-base font-bold leading-6 tracking-[0.15px] text-[#00101A]">
            {kudo.receiver.name}
          </span>
        </KudosAvatarLink>
      </div>

      <div
        aria-hidden="true"
        className="h-px w-full bg-saa-kudos-card-border"
        style={{ backgroundColor: "#FFEA9E" }}
      />

      <div className="flex w-full flex-col gap-4">
        <time
          className="font-display text-base font-bold leading-6 tracking-[0.5px] text-saa-kudos-time-fg"
          dateTime={
            kudo.createdAt instanceof Date
              ? kudo.createdAt.toISOString()
              : new Date(kudo.createdAt).toISOString()
          }
        >
          {formatKudoTime(kudo.createdAt)}
        </time>

        <div
          className="flex w-full flex-col gap-2 self-stretch rounded-[12px] border border-saa-kudos-card-border bg-saa-kudos-filter-active px-6 py-4"
          style={{
            borderColor: "#FFEA9E",
            backgroundColor: "rgba(255, 234, 158, 0.40)",
          }}
        >
          <p className="line-clamp-5 whitespace-pre-line text-justify font-display text-xl font-bold leading-8 text-[#00101A]">
            {kudo.content}
          </p>
          <Link
            href={`/sun-kudos/${kudo.id}`}
            className="self-end font-display text-sm font-bold leading-6 text-saa-kudos-hashtag-fg underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-button-primary focus-visible:ring-offset-2 focus-visible:ring-offset-saa-kudos-card"
          >
            {t("kudos.card.detail_link", locale)}
          </Link>
        </div>

        <KudoImageGallery images={kudo.images} locale={locale} />

        <div className="flex w-full flex-row flex-wrap items-center gap-3">
          <KudoHashtagChips hashtags={visibleHashtags} />
          {overflowCount > 0 ? (
            <span className="font-display text-base font-bold leading-6 tracking-[0.5px] text-saa-kudos-hashtag-fg">
              {overflowLabel}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
