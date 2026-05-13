import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { kudosService } from "@/src/services/kudos-service";

// Auth.js + Prisma adapter require Node runtime — Edge is incompatible.
export const runtime = "nodejs";

/**
 * POST /api/kudos — create a new Kudo (US1). Implements the auth-gate
 * template documented at
 * `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/assets/auth-pattern.md`.
 */
export async function POST(request: Request): Promise<Response> {
  let session: Session | null = null;
  try {
    session = (await auth()) as Session | null;
  } catch (err) {
    logger.warn("auth.lookup-failed", {
      route: "/api/kudos",
      message: err instanceof Error ? err.message : "unknown",
    });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const kudo = await kudosService.create(raw, { user: { id: session.user.id } });
    return NextResponse.json(kudo, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    logger.error("kudos.create-failed", {
      userId: session.user.id,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
