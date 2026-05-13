import { kudosRepository } from "@/src/repositories/kudos-repository";
import type { Kudo } from "@/src/lib/kudos/types";
import { createKudoSchema } from "@/src/lib/validation/kudos";

/**
 * Kudo service — Constitution II layer between route handlers and the
 * repository. Owns business policy (Zod parse, hashtag dedup, ownership via
 * the session) so the route stays under 30 LOC and the repository stays
 * persistence-only.
 */

type ServiceSession = { user: { id: string } };

function dedupe<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export const kudosService = {
  /**
   * Validates the request body with `createKudoSchema`, deduplicates hashtag
   * IDs, and delegates to the repository's atomic `$transaction`. Throws
   * `ZodError` for invalid input — the route maps that to HTTP 400.
   */
  async create(input: unknown, session: ServiceSession): Promise<Kudo> {
    const parsed = createKudoSchema.parse(input);
    return kudosRepository.create({
      senderUserId: session.user.id,
      receiverUserId: parsed.receiverUserId,
      content: parsed.content,
      hashtagIds: dedupe(parsed.hashtagIds),
      imageUrls: parsed.imageUrls,
    });
  },
};
