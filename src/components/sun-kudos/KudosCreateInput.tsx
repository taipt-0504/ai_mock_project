"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

type Props = {
  locale: SupportedLocale;
};

const WRITE_ROUTE = "/sun-kudos/write";

/**
 * A.1 — Button ghi nhận. Visually an input pill, semantically a button: clicking
 * navigates to the Viết Kudo dialog (`ihQ26W78P2`, OOS per Q-PLAN9 — the stub
 * route `/sun-kudos/write` ships a placeholder). After the dialog lands, dialog
 * success will call `router.refresh()` to prepend the new Kudo to the feed.
 */
export default function KudosCreateInput({ locale }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={t("kudos.write.input.aria_label", locale)}
      onClick={() => router.push(WRITE_ROUTE)}
      className={[
        "flex h-[72px] w-full max-w-[738px] items-center gap-2",
        "rounded-[68px] border border-saa-dropdown-border bg-saa-kudos-filter",
        "px-4 py-6 text-left transition-colors",
        "hover:bg-saa-kudos-filter-active",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-button-primary focus-visible:ring-offset-2 focus-visible:ring-offset-saa-page",
      ].join(" ")}
    >
      <span className="flex w-full items-center gap-4">
        <Image
          src="/assets/sun-kudos/icons/pen.svg"
          alt=""
          width={24}
          height={24}
          aria-hidden="true"
          className="block shrink-0"
        />
        <span className="flex-1 text-center font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg">
          {t("kudos.write.input.placeholder", locale)}
        </span>
      </span>
    </button>
  );
}
