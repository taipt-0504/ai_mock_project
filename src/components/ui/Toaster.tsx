"use client";

import { useEffect, useState } from "react";

import { subscribeToast, type ToastMessage } from "@/src/components/ui/toast";

export default function Toaster() {
  const [messages, setMessages] = useState<ReadonlyArray<ToastMessage>>([]);

  useEffect(() => {
    const unsubscribe = subscribeToast((message) => {
      setMessages((current) => [...current, message]);
      window.setTimeout(() => {
        setMessages((current) => current.filter((m) => m.id !== message.id));
      }, message.durationMs);
    });
    return unsubscribe;
  }, []);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {messages.map((m) => (
        <div
          key={m.id}
          className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm font-display font-medium shadow-lg motion-safe:animate-in motion-safe:fade-in ${
            m.variant === "error"
              ? "border-red-400 bg-red-950/95 text-red-100"
              : "border-saa-dropdown-border bg-saa-dropdown-surface text-saa-page-fg"
          }`}
        >
          {m.message}
        </div>
      ))}
    </div>
  );
}
