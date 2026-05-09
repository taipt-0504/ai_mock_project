"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";

export type LoginButtonLabels = {
  label: string;
  errorGeneric: string;
  errorCookies: string;
  errorCancelled: string;
};

type ErrorKind = null | "generic" | "cookies" | "cancelled";

/**
 * LOGIN With Google button (B.3). Clicking initiates the Auth.js Google
 * OAuth flow via a full-page navigation (Login spec US1 scenario 1).
 *
 * Receives pre-translated labels as props instead of looking them up itself
 * — keeps the client bundle free of the server-only i18n module (which
 * uses `node:async_hooks` via `logger`).
 */
export default function LoginButton({ labels }: { labels: LoginButtonLabels }) {
  const [isPending, startTransition] = useTransition();
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);

  // Edge case: returning from a cancelled OAuth window — clear pending state
  // so the button re-enables.
  useEffect(() => {
    const onPageHide = () => setErrorKind(null);
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  const handleClick = () => {
    if (isPending) return; // Edge case: multiple rapid clicks
    setErrorKind(null);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setErrorKind("generic");
      return;
    }
    startTransition(async () => {
      try {
        await signIn("google", { callbackUrl: "/" });
      } catch {
        setErrorKind("generic");
      }
    });
  };

  const errorText =
    errorKind === "generic"
      ? labels.errorGeneric
      : errorKind === "cookies"
        ? labels.errorCookies
        : errorKind === "cancelled"
          ? labels.errorCancelled
          : null;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
        aria-disabled={isPending}
        aria-label={labels.label}
        className="flex h-[60px] w-[305px] items-center justify-start gap-2 rounded-lg bg-saa-button-primary px-6 py-4 disabled:opacity-70"
      >
        <span className="flex h-7 w-[225px] items-center justify-center font-display text-[22px] font-bold leading-7 whitespace-nowrap text-saa-button-primary-fg">
          {labels.label}
        </span>
        <Image
          src="/assets/login/icons/google.svg"
          alt=""
          width={24}
          height={24}
        />
      </button>
      {errorText && (
        <p
          role="alert"
          className="font-display text-sm font-medium leading-5 text-saa-page-fg"
        >
          {errorText}
        </p>
      )}
    </div>
  );
}
