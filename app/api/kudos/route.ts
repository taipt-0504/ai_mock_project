import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/src/lib/auth";
import { logger } from "@/src/lib/logger";
import { kudosService } from "@/src/services/kudos-service";

// Auth.js + Prisma adapter require Node runtime — Edge is incompatible.
export const runtime = "nodejs";

async function resolveSession(route: string): Promise<Session | null> {
  try {
    return (await auth()) as Session | null;
  } catch (err) {
    logger.warn("auth.lookup-failed", {
      route,
      message: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

/**
 * GET /api/kudos — paginated All Kudos feed (US4 / Phase 5 T042). Reads
 * `hashtag`, `dept`, `cursor`, `limit` from the querystring, delegates to
 * `kudosService.listFeed`, returns `{ items, nextCursor }`. Auth gate applies
 * because the Live Board is internal (Constitution IV A01).
 */
export async function GET(request: Request): Promise<Response> {
  const session = await resolveSession("/api/kudos");
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  try {
    const page = await kudosService.listFeed(
      { hashtag: params.hashtag, dept: params.dept },
      { cursor: params.cursor, limit: params.limit },
    );
    return NextResponse.json(page, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "invalid_query" }, { status: 400 });
    }
    logger.error("kudos.list-feed-failed", {
      userId: session.user.id,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

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
