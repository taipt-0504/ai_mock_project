"use server";

import { signOut } from "@/src/lib/auth";

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
