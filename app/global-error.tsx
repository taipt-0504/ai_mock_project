"use client";

import { useEffect } from "react";

/**
 * Application-level error boundary (Next.js convention). Catches
 * unhandled exceptions outside the route-level `error.tsx` boundaries.
 * Server logger is unreachable here (it uses `node:async_hooks`).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("global.error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#00101a",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ opacity: 0.8, margin: 0 }}>Please try again.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 8,
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            background: "#FFEA9E",
            color: "#000",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
