"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const TICK_INTERVAL_MS = 60_000;

/**
 * US3 scenario 3 — when a visitor has the prelaunch tab open across the
 * `SAA_LAUNCH_AT` zero boundary, this companion fires `router.refresh()`
 * exactly once after the wall clock crosses the threshold. The next request
 * hits the proxy (gate now lifted) → 307 to `/`.
 *
 * why: the `useRef` guard makes the refresh idempotent across re-renders or
 * a changed `launchAt` prop — even if the effect re-mounts, refresh fires
 * AT MOST once per component lifetime.
 */
export default function PrelaunchAutoExit({
  launchAt,
}: {
  launchAt: Date | null;
}) {
  const router = useRouter();
  const refreshFiredRef = useRef(false);

  useEffect(() => {
    if (!launchAt) return;
    if (refreshFiredRef.current) return;
    if (launchAt.getTime() <= Date.now()) return;

    const intervalId = window.setInterval(() => {
      if (refreshFiredRef.current) return;
      if (launchAt.getTime() <= Date.now()) {
        refreshFiredRef.current = true;
        window.clearInterval(intervalId);
        router.refresh();
      }
    }, TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [launchAt, router]);

  return null;
}
