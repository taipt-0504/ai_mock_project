"use client";

import Image from "next/image";
import { useState } from "react";

import KudoImageLightbox from "@/src/components/sun-kudos/KudoImageLightbox";
import type { KudoImage } from "@/src/lib/kudos/types";
import { t } from "@/src/lib/i18n";
import type { SupportedLocale } from "@/src/lib/i18n/types";

type Props = {
  images: KudoImage[];
  locale: SupportedLocale;
};

const MAX_THUMBS = 5;

/**
 * KudosCard image gallery (Phase 5 T055 wiring). Caps the thumbnail row at
 * 5 per Figma C.3.6; clicking a thumbnail opens KudoImageLightbox at the
 * matching index. Images past index 5 are still passed to the lightbox so
 * users can page through everything once the modal is open.
 */
export default function KudoImageGallery({ images, locale }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  const thumbs = images.slice(0, MAX_THUMBS);

  return (
    <>
      <div className="flex w-full flex-row items-center gap-4">
        {thumbs.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-saa-dropdown-border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-button-primary focus-visible:ring-offset-2 focus-visible:ring-offset-saa-kudos-card"
          >
            <Image
              src={image.url}
              alt={t("kudos.card.gallery_thumb_alt", locale)}
              width={image.width ?? 88}
              height={image.height ?? 88}
              className="h-full w-full object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>
      <KudoImageLightbox
        open={activeIndex !== null}
        images={images}
        initialIndex={activeIndex ?? 0}
        onClose={() => setActiveIndex(null)}
        locale={locale}
      />
    </>
  );
}
