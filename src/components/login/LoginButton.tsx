import Image from "next/image";

/**
 * UI-only placeholder for the LOGIN With Google button (B.3).
 * The Auth.js `signIn('google', { callbackUrl })` wiring lands in Phase 3 step
 * T048 of tasks.md (US1 implementation). This component renders the visual
 * shell only.
 */
export default function LoginButton() {
  return (
    <button
      type="button"
      className="flex h-[60px] w-[305px] items-center justify-start gap-2 rounded-lg bg-saa-button-primary px-6 py-4"
      aria-label="LOGIN With Google"
    >
      <span className="flex h-7 w-[225px] items-center justify-center font-display text-[22px] font-bold leading-7 text-saa-button-primary-fg">
        LOGIN With Google
      </span>
      <Image
        src="/assets/login/icons/google.svg"
        alt=""
        width={24}
        height={24}
      />
    </button>
  );
}
