"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary for `/login` (Next.js convention). Catches
 * unhandled exceptions in the Server Component tree (and the Client
 * components below it) so the user sees a static fallback instead of a
 * Next.js stack trace.
 *
 * Logged via `console.error` because this is a CLIENT boundary — the server
 * logger (which uses `node:async_hooks`) cannot run here. The server-side
 * cause was already logged by the upstream code that threw.
 */
export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the digest so it can be cross-referenced with server logs.

    console.error("login.error-boundary", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-saa-page px-6 py-12 text-center text-saa-page-fg">
      <h1 className="font-display text-2xl font-bold leading-8">
        Something went wrong
      </h1>
      <p className="font-display text-base leading-6 opacity-80">
        We couldn&apos;t load the sign-in page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-saa-button-primary px-6 py-3 font-display text-base font-bold text-saa-button-primary-fg"
      >
        Try again
      </button>
    </main>
  );
}
