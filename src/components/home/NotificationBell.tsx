"use client";

import Image from "next/image";

import { toast } from "@/src/components/ui/toast";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

export default function NotificationBell({
  locale,
  unreadCount,
}: {
  locale: SupportedLocale;
  unreadCount: number;
}) {
  const hasUnread = unreadCount > 0;

  const handleClick = () => {
    toast(t("home.notification.toast.coming_soon", locale));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("home.notification.aria_label", locale)}
      className="relative flex h-10 w-10 items-center justify-center rounded motion-safe:transition-colors hover:bg-white/5"
    >
      <Image
        src="/assets/home/icons/bell.svg"
        alt=""
        aria-hidden="true"
        width={24}
        height={24}
      />
      {hasUnread ? (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-saa-notification-dot"
        />
      ) : null}
    </button>
  );
}
