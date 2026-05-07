import { NextResponse } from "next/server";

import { auth } from "@/src/lib/auth";
import { getUnreadCount } from "@/src/services/notification-service";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const unreadCount = await getUnreadCount(session.user.id);
  return NextResponse.json(
    { unreadCount },
    { headers: { "Cache-Control": "no-store" } },
  );
}
