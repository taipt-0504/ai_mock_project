import type { Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import type {
  Kudo,
  KudoAuthor,
  KudoCursor,
  KudoFeedPage,
  KudoFilter,
} from "@/src/lib/kudos/types";

/**
 * Kudo persistence boundary. Only this module touches the Prisma client for
 * the Kudo aggregate (Constitution II — layered flow). The `$transaction`
 * wrap on `create` is non-negotiable: insert + many-to-many + counter
 * increments MUST commit together or roll back together so the Live Board
 * never observes a half-applied state.
 */

type CreateKudoArgs = {
  senderUserId: string;
  receiverUserId: string;
  content: string;
  hashtagIds: string[];
  imageUrls: string[];
};

type ListFeedArgs = {
  filter: KudoFilter;
  cursor: KudoCursor | null;
  limit: number;
};

type PersistedKudo = Prisma.KudoGetPayload<{
  include: {
    sender: true;
    receiver: true;
    hashtags: { include: { hashtag: true } };
    images: true;
  };
}>;

function authorFromUser(
  user: {
    id: string;
    name: string | null;
    image: string | null;
    title: string | null;
    departmentId: string | null;
  },
): KudoAuthor {
  return {
    id: user.id,
    name: user.name,
    image: user.image,
    title: user.title,
    departmentId: user.departmentId,
  };
}

function kudoFromRow(row: PersistedKudo): Kudo {
  return {
    id: row.id,
    content: row.content,
    heartCount: row.heartCount,
    createdAt: row.createdAt,
    sender: authorFromUser(row.sender),
    receiver: authorFromUser(row.receiver),
    hashtags: row.hashtags.map(({ hashtag }) => ({
      id: hashtag.id,
      name: hashtag.name,
      slug: hashtag.slug,
    })),
    images: row.images
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((image) => ({
        id: image.id,
        url: image.url,
        width: image.width,
        height: image.height,
        order: image.order,
      })),
  };
}

export const kudosRepository = {
  async create(args: CreateKudoArgs): Promise<Kudo> {
    const { senderUserId, receiverUserId, content, hashtagIds, imageUrls } = args;

    const created = await prisma.$transaction(async (tx) => {
      const kudo = await tx.kudo.create({
        data: {
          senderUserId,
          receiverUserId,
          content,
          hashtags: hashtagIds.length
            ? { create: hashtagIds.map((hashtagId) => ({ hashtagId })) }
            : undefined,
          images: imageUrls.length
            ? {
                create: imageUrls.map((url, order) => ({ url, order })),
              }
            : undefined,
        },
        include: {
          sender: true,
          receiver: true,
          hashtags: { include: { hashtag: true } },
          images: { orderBy: { order: "asc" } },
        },
      });

      await tx.user.update({
        where: { id: senderUserId },
        data: { kudosSentCount: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: receiverUserId },
        data: { kudosReceivedCount: { increment: 1 } },
      });

      return kudo;
    });

    return kudoFromRow(created);
  },

  /**
   * Cursor-paginated feed. Ordering is `(createdAt DESC, id DESC)` so cursor
   * decoding is monotonic. Filter composition:
   * - `hashtag` (slug) → kudos whose hashtag rows include the slug.
   * - `dept` (departmentId) → kudos where sender OR receiver belongs to the
   *   department (Q-LB5).
   * - Hashtag + dept compose with AND (Q-LB6).
   * The query fetches `limit + 1` rows to detect whether more pages exist
   * without a second round-trip.
   */
  async listFeed(args: ListFeedArgs): Promise<KudoFeedPage> {
    const { filter, cursor, limit } = args;

    const where: Prisma.KudoWhereInput = {};
    if (filter.hashtag) {
      where.hashtags = {
        some: { hashtag: { slug: filter.hashtag } },
      };
    }
    if (filter.dept) {
      where.OR = [
        { sender: { departmentId: filter.dept } },
        { receiver: { departmentId: filter.dept } },
      ];
    }
    if (cursor) {
      where.AND = [
        {
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { lt: cursor.id } },
          ],
        },
      ];
    }

    const rows = await prisma.kudo.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: {
        sender: true,
        receiver: true,
        hashtags: { include: { hashtag: true } },
        images: true,
      },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = page.map(kudoFromRow);
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null;

    return { items, nextCursor };
  },
};
