import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/src/lib/auth";
import { setSaaLocale } from "@/src/lib/cookies/saa-locale";
import { isSupportedLocale, type SupportedLocale } from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";
import { localeService } from "@/src/services/locale-service";

// Auth.js + Prisma adapter require Node runtime — Edge Runtime is incompatible.
export const runtime = "nodejs";

const bodySchema = z.object({
  locale: z
    .string()
    .refine((v): v is SupportedLocale => isSupportedLocale(v), {
      message: "unsupported_locale",
    }),
});

/**
 * POST /api/i18n/locale — persist the caller's preferred UI locale.
 *
 * - Unauthenticated → 401 (the client writes the `saa_locale` cookie locally
 *   instead; the API is reserved for authenticated persistence per FR-009).
 * - Authenticated + valid body → 204, `User.locale` updated, `saa_locale`
 *   cookie mirrored so SSR reads pick up the new value on the next request.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }

  try {
    await localeService.setLocale(userId, parsed.data.locale);
    await setSaaLocale(parsed.data.locale);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    logger.error("locale.update-failed", {
      userId,
      locale: parsed.data.locale,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
