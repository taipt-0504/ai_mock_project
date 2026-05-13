"use client";

import Image from "next/image";
import { useEffect } from "react";

import type { KudoImage } from "@/src/lib/kudos/types";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

type Props = {
  open: boolean;
  images: KudoImage[];
  initialIndex: number;
  onClose: () => void;
  locale: SupportedLocale;
};

/**
 * Modal overlay for the Kudo image gallery (Phase 5 T052). Renders the
 * currently selected image full-screen above the page. Escape + backdrop +
 * close-button all dismiss; clicks inside the image content do not bubble.
 * Body scroll is locked while open so the modal acts like a true dialog.
 */
export default function KudoImageLightbox({
  open,
  images,
  initialIndex,
  onClose,
  locale,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;
  const current = images[initialIndex] ?? images[0];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("kudos.lightbox.image_alt", locale)}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,16,26,0.92)] p-6"
    >
      <button
        type="button"
        data-testid="kudos-lightbox-backdrop"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-zoom-out"
      />
      <div className="relative z-10 flex max-h-full max-w-[1200px] flex-col items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="self-end rounded-full border border-saa-dropdown-border bg-saa-kudos-filter px-4 py-2 font-display text-sm font-bold text-saa-page-fg transition-colors hover:bg-saa-kudos-filter-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-button-primary focus-visible:ring-offset-2 focus-visible:ring-offset-saa-page"
        >
          {t("kudos.lightbox.close", locale)}
        </button>
        <Image
          src={current.url}
          alt={t("kudos.lightbox.image_alt", locale)}
          width={current.width ?? 1200}
          height={current.height ?? 800}
          className="max-h-[80vh] w-auto rounded-lg object-contain"
          unoptimized
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}
