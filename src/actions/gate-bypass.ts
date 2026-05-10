"use server";

import { redirect } from "next/navigation";

import {
  clearGateBypass,
  setGateBypass,
} from "@/src/lib/cookies/gate-bypass";

/**
 * **Demo-only.** Sets the prelaunch-gate bypass cookie on the caller and
 * sends them past the gate to `/`. Bound to the "Skip prelaunch (demo)"
 * button on `/coming-soon`.
 */
export async function enableGateBypassAction(): Promise<void> {
  await setGateBypass();
  redirect("/");
}

/**
 * **Demo-only.** Clears the bypass cookie and sends the caller back to the
 * prelaunch screen so they can verify the gate is in fact blocking again.
 * Bound to the "Demo bypass active · Clear" banner shown on post-gate
 * pages while the cookie is set.
 */
export async function clearGateBypassAction(): Promise<void> {
  await clearGateBypass();
  redirect("/coming-soon");
}
