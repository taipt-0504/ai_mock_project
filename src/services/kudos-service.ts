import { kudosRepository } from "@/src/repositories/kudos-repository";
import type { Kudo, KudoFeedPage } from "@/src/lib/kudos/types";
import {
  createKudoSchema,
  cursorSchema,
  kudoFilterQuerySchema,
  type KudoFilterQuery,
} from "@/src/lib/validation/kudos";

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

type ListFeedFilter = Pick<KudoFilterQuery, "hashtag" | "dept">;

type ListFeedOptions = {
  cursor?: string;
  limit?: number | string;
};

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

  /**
   * Paginated feed. Accepts the raw query string shape so the route layer can
   * forward `searchParams` directly; cursor is decoded via `cursorSchema`.
   * Throws `ZodError` for malformed input.
   */
  async listFeed(
    filter: ListFeedFilter,
    options: ListFeedOptions = {},
  ): Promise<KudoFeedPage> {
    const parsedFilter = kudoFilterQuerySchema.parse({
      hashtag: filter.hashtag,
      dept: filter.dept,
      cursor: options.cursor,
      limit: options.limit ?? 20,
    });
    const decodedCursor = parsedFilter.cursor
      ? cursorSchema.parse(parsedFilter.cursor)
      : null;
    return kudosRepository.listFeed({
      filter: {
        hashtag: parsedFilter.hashtag,
        dept: parsedFilter.dept,
      },
      cursor: decodedCursor,
      limit: parsedFilter.limit,
    });
  },
};
