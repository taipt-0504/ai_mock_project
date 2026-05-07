"use client";

import { useEffect, useState } from "react";

import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  isInPast: boolean;
};

function computeParts(
  eventStart: Date | null,
  now: Date,
): CountdownParts | null {
  if (!eventStart) return null;
  const diffMs = eventStart.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, isInPast: true };
  }
  const days = Math.floor(diffMs / MS_PER_DAY);
  const hours = Math.floor((diffMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutes = Math.floor((diffMs % MS_PER_HOUR) / MS_PER_MINUTE);
  return { days, hours, minutes, isInPast: false };
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export default function Countdown({
  eventStart,
  locale,
}: {
  eventStart: Date | null;
  locale: SupportedLocale;
}) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, MS_PER_MINUTE);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const parts = computeParts(eventStart, now);
  const showSubtitle = !parts || !parts.isInPast;

  const tiles: ReadonlyArray<{ label: string; value: string }> = [
    {
      label: t("home.hero.countdown.days", locale),
      value: parts ? pad2(parts.days) : "--",
    },
    {
      label: t("home.hero.countdown.hours", locale),
      value: parts ? pad2(parts.hours) : "--",
    },
    {
      label: t("home.hero.countdown.minutes", locale),
      value: parts ? pad2(parts.minutes) : "--",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {showSubtitle ? (
        <p className="font-display text-2xl font-bold leading-8 text-saa-page-fg">
          {t("home.hero.subtitle", locale)}
        </p>
      ) : null}
      <div className="flex flex-row items-center gap-10">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex flex-col items-start justify-center gap-3.5"
            style={{ width: 116, height: 128 }}
          >
            <div className="flex h-[82px] w-full items-center font-display text-[72px] font-bold leading-[82px] tracking-tight text-saa-page-fg">
              {tile.value}
            </div>
            <span className="font-display text-2xl font-bold leading-8 text-saa-page-fg">
              {tile.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
