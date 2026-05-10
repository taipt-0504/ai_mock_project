"use client";

import { createElement, useEffect, useState } from "react";

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

type Size = "md" | "lg";

// LED tile + label sizing tokens. Mirrors `.saa-countdown-tile-{md,lg}` in
// app/globals.css (Figma 8PJQswPZmU + i87tDx10uM B1.3); kept here only to
// drive layout/typography pieces Tailwind needs as inline arbitrary values.
const SIZE_TOKENS: Record<
  Size,
  {
    tile: string; // class for digit tile
    digitFontSize: string; // DSEG7 font-size (px) — matches Figma exactly
    digitGap: string; // gap between the two digit tiles (px)
    label: string; // label typography (Montserrat)
    columnGap: string; // vertical gap between digit row and label
    groupGap: string; // horizontal gap between Days/Hours/Minutes groups
    digitWidthPx: number; // digit text box width (Figma)
  }
> = {
  lg: {
    tile: "saa-countdown-tile saa-countdown-tile-lg",
    digitFontSize: "text-[73.728px] leading-[95px]",
    digitGap: "gap-[21px]",
    label: "font-display text-4xl font-bold leading-[48px]",
    columnGap: "gap-6",
    groupGap: "gap-[60px]",
    digitWidthPx: 59,
  },
  md: {
    tile: "saa-countdown-tile saa-countdown-tile-md",
    digitFontSize: "text-[49.152px] leading-[63px]",
    digitGap: "gap-[14px]",
    label: "font-display text-2xl font-bold leading-8",
    columnGap: "gap-[14px]",
    groupGap: "gap-10",
    digitWidthPx: 40,
  },
};

function DigitTile({ char, size }: { char: string; size: Size }) {
  const tokens = SIZE_TOKENS[size];
  return (
    <div className={tokens.tile}>
      <span
        aria-hidden="true"
        style={{
          fontFamily: "var(--font-led), monospace",
          width: tokens.digitWidthPx,
          textAlign: "center",
        }}
        className={`${tokens.digitFontSize} font-normal text-saa-countdown-digit-fg`}
      >
        {char}
      </span>
    </div>
  );
}

export default function Countdown({
  eventStart,
  locale,
  subtitleAs = "p",
  subtitleKey = "home.hero.subtitle",
  size = "md",
  align = "start",
}: {
  eventStart: Date | null;
  locale: SupportedLocale;
  subtitleAs?: "p" | "h1";
  subtitleKey?: string;
  size?: Size;
  align?: "start" | "center";
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
  // FR-008 (revised 2026-05-10): once the event has started, hide the entire
  // Countdown — tiles + subtitle. Leaving 00 / 00 / 00 on the page suggested
  // the event was still ahead and looked broken. EventInfo continues to
  // render the venue / livestream copy independently.
  if (parts?.isInPast) {
    return null;
  }

  const tokens = SIZE_TOKENS[size];
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

  const alignmentClass = align === "center" ? "items-center" : "items-start";
  const subtitleAlignClass = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`flex flex-col ${alignmentClass} ${tokens.columnGap}`}>
      {createElement(
        subtitleAs,
        {
          className: `${tokens.label} ${subtitleAlignClass} text-saa-page-fg`,
        },
        t(subtitleKey, locale),
      )}
      <div className={`flex flex-row items-center ${tokens.groupGap}`}>
        {tiles.map((tile) => {
          const [d1, d2] = [tile.value.charAt(0), tile.value.charAt(1)];
          return (
            <div
              key={tile.label}
              className={`flex flex-col items-start justify-center ${tokens.columnGap}`}
            >
              <div
                className={`flex flex-row items-center ${tokens.digitGap}`}
                aria-label={`${tile.value} ${tile.label}`}
              >
                <DigitTile char={d1} size={size} />
                <DigitTile char={d2} size={size} />
              </div>
              <span className={`${tokens.label} text-saa-page-fg`}>
                {tile.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
