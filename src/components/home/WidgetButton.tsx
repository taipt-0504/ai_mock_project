"use client";

import Image from "next/image";

import { toast } from "@/src/components/ui/toast";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function WidgetButton({ locale }: { locale: SupportedLocale }) {
  const showComingSoon = () => {
    toast(t("home.notification.toast.coming_soon", locale));
  };

  return (
    <div
      role="toolbar"
      aria-label="Quick actions"
      className="fixed bottom-6 right-6 z-40 flex h-16 items-center gap-2 rounded-full bg-saa-fab-bg px-4 py-4 [box-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]"
    >
      <button
        type="button"
        onClick={showComingSoon}
        aria-label={t("home.fab.write_kudos", locale)}
        className="flex items-center gap-2 motion-safe:transition-transform motion-safe:hover:scale-110"
      >
        <Image
          src="/assets/home/icons/pen.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
        />
      </button>
      <span aria-hidden="true" className="font-display text-2xl font-bold leading-8 text-saa-fab-fg">
        /
      </span>
      <button
        type="button"
        onClick={showComingSoon}
        aria-label={t("home.fab.read_rules", locale)}
        className="flex items-center motion-safe:transition-transform motion-safe:hover:scale-110"
      >
        <Image
          src="/assets/home/icons/kudos-logo-small.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
        />
      </button>
    </div>
  );
}
