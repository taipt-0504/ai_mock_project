import { prisma } from "@/src/lib/prisma";
import type { Kudo, KudoAuthor } from "@/src/lib/kudos/types";

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

    return {
      id: created.id,
      content: created.content,
      heartCount: created.heartCount,
      createdAt: created.createdAt,
      sender: authorFromUser(created.sender),
      receiver: authorFromUser(created.receiver),
      hashtags: created.hashtags.map(({ hashtag }) => ({
        id: hashtag.id,
        name: hashtag.name,
        slug: hashtag.slug,
      })),
      images: created.images.map((image) => ({
        id: image.id,
        url: image.url,
        width: image.width,
        height: image.height,
        order: image.order,
      })),
    };
  },
};
