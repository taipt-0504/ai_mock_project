import { z } from "zod";

/**
 * Zod validation contracts for every external boundary into the Kudos API
 * surface (Constitution Principle II — "Validate all external boundary data
 * with a schema validator before use"). Route handlers MUST parse via these
 * schemas before forwarding to the service layer.
 */

const MAX_CONTENT_LENGTH = 2000;
const MAX_HASHTAGS_PER_KUDO = 5;
const MAX_IMAGES_PER_KUDO = 5;
const MAX_SPOTLIGHT_QUERY = 100;

export const createKudoSchema = z.object({
  receiverUserId: z.string().min(1),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH),
  hashtagIds: z.array(z.string().min(1)).max(MAX_HASHTAGS_PER_KUDO).default([]),
  imageUrls: z.array(z.string().url()).max(MAX_IMAGES_PER_KUDO).default([]),
});
export type CreateKudoInput = z.infer<typeof createKudoSchema>;

export const kudoLikeParamsSchema = z.object({
  id: z.string().min(1),
});

/**
 * `<iso8601>|<kudoId>` encoding mirroring `kudos-repository.listFeed` cursor
 * shape. Defended on the receive side so a tampered cursor cannot pivot the
 * feed into an arbitrary state.
 */
export const cursorSchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      const [iso, id] = value.split("|");
      if (!iso || !id) return false;
      return !Number.isNaN(Date.parse(iso));
    },
    { message: "Invalid cursor encoding" },
  )
  .transform((value) => {
    const [iso, id] = value.split("|");
    return { createdAt: new Date(iso), id };
  });

export const kudoFilterQuerySchema = z.object({
  hashtag: z.string().min(1).max(120).optional(),
  dept: z.string().min(1).max(120).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type KudoFilterQuery = z.infer<typeof kudoFilterQuerySchema>;

export const spotlightSearchSchema = z.object({
  q: z.string().min(1).max(MAX_SPOTLIGHT_QUERY),
});

export const KUDOS_VALIDATION_LIMITS = {
  MAX_CONTENT_LENGTH,
  MAX_HASHTAGS_PER_KUDO,
  MAX_IMAGES_PER_KUDO,
  MAX_SPOTLIGHT_QUERY,
} as const;
