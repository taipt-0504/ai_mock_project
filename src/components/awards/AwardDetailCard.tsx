import Image from "next/image";

import { AWARD_BG_ASSET, type Award } from "@/src/lib/awards/awards";
import { formatVndAmount } from "@/src/lib/awards/format";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function AwardDetailCard({
  award,
  locale,
}: {
  award: Award;
  locale: SupportedLocale;
}) {
  const title = t(award.titleKey, locale);
  const description = t(award.descriptionKey, locale);
  const quantityLabel = t("awards.detail.quantity_label", locale);
  const valueLabel = t("awards.detail.value_label", locale);
  const unit = award.unitKey !== null ? t(award.unitKey, locale) : null;

  return (
    <article
      id={award.slug}
      className="flex w-full max-w-[856px] flex-col gap-20 [scroll-margin-top:var(--saa-header-scroll-margin)]"
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="relative flex h-[336px] w-[336px] shrink-0 items-center justify-center self-center overflow-hidden rounded-3xl border border-saa-button-primary [box-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287] lg:self-start">
          <Image
            src={AWARD_BG_ASSET}
            alt=""
            aria-hidden="true"
            fill
            sizes="336px"
            className="object-cover"
          />
          <Image
            src={award.labelAsset}
            alt={title}
            width={award.labelWidth}
            height={award.labelHeight}
            className="relative z-10 object-contain"
          />
        </div>

        <div className="flex flex-1 flex-col gap-8">
          <h3 className="font-display text-2xl font-bold leading-8 text-saa-button-primary">
            {title}
          </h3>
          <p className="text-justify font-display text-base font-bold leading-6 tracking-[0.5px] text-saa-page-fg">
            {description}
          </p>

          <hr className="h-px w-full max-w-[480px] border-0 bg-saa-divider" />

          <p className="font-display text-2xl font-bold leading-8">
            <span className="text-saa-button-primary">{quantityLabel}</span>{" "}
            <span className="text-saa-page-fg">
              {award.quantity}
              {unit !== null && ` ${unit}`}
            </span>
          </p>

          <hr className="h-px w-full max-w-[480px] border-0 bg-saa-divider" />

          <div className="flex flex-col gap-6">
            <ValueTier
              label={valueLabel}
              amount={award.valueVND}
              caption={
                award.valueVNDSecondary !== null
                  ? t("awards.detail.value_individual", locale)
                  : null
              }
            />

            {award.valueVNDSecondary !== null && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold leading-5 tracking-[0.1px] text-saa-divider">
                    Hoặc
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-saa-divider" />
                </div>
                <ValueTier
                  label={valueLabel}
                  amount={award.valueVNDSecondary}
                  caption={t("awards.detail.value_team", locale)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <hr className="h-px w-full max-w-[853px] border-0 bg-saa-divider" />
    </article>
  );
}

function ValueTier({
  label,
  amount,
  caption,
}: {
  label: string;
  amount: number;
  caption: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-2xl font-bold leading-8 text-saa-button-primary">
        {label}
      </p>
      <p className="font-display text-4xl font-bold leading-[44px] text-saa-page-fg">
        {formatVndAmount(amount)} VNĐ
      </p>
      {caption !== null && (
        <p className="font-display text-sm font-bold leading-5 tracking-[0.1px] text-saa-page-fg">
          {caption}
        </p>
      )}
    </div>
  );
}
