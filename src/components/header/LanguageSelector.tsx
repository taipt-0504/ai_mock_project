import Image from "next/image";

/**
 * Static chip-only placeholder for the FR-007 language selector.
 * Interactive disclosure dropdown lands in Phase 5 (US3) per plan.md.
 */
export default function LanguageSelector() {
  return (
    <button
      type="button"
      aria-label="Language: VN"
      className="flex h-14 w-[108px] items-center justify-between gap-0.5 rounded p-4"
    >
      <span className="flex h-6 w-[53px] items-center gap-1">
        <Image
          src="/assets/header/icons/flag-vn.svg"
          alt=""
          width={24}
          height={24}
        />
        <span className="font-display text-base font-bold leading-6 tracking-[0.15px] text-saa-page-fg">
          VN
        </span>
      </span>
      <Image
        src="/assets/header/icons/chevron-down.svg"
        alt=""
        width={24}
        height={24}
      />
    </button>
  );
}
