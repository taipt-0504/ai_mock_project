/**
 * Shared TypeScript types for the Sun* Kudos Live Board domain (Phase 2 of
 * MaZUn5xHXZ plan). Mirrors the Prisma models without coupling consumers
 * directly to the generated `@prisma/client` types — feature code imports
 * these façade types so services can swap representations without ripple.
 */

export type KudoId = string;
export type UserId = string;
export type HashtagId = string;
export type DepartmentId = string;

export type Hashtag = {
  id: HashtagId;
  name: string;
  slug: string;
};

export type Department = {
  id: DepartmentId;
  name: string;
};

export type KudoImage = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  order: number;
};

export type KudoAuthor = {
  id: UserId;
  name: string | null;
  image: string | null;
  title: string | null;
  departmentId: DepartmentId | null;
};

export type KudoLike = {
  id: string;
  kudoId: KudoId;
  userId: UserId;
  isSpecialDayLike: boolean;
  createdAt: Date;
};

export type Kudo = {
  id: KudoId;
  sender: KudoAuthor;
  receiver: KudoAuthor;
  content: string;
  heartCount: number;
  hashtags: Hashtag[];
  images: KudoImage[];
  createdAt: Date;
};

/**
 * Filter inputs accepted by the feed + highlight endpoints. `hashtag` /
 * `dept` are slug/name strings — service layer resolves to IDs.
 */
export type KudoFilter = {
  hashtag?: string;
  dept?: string;
};

/**
 * Cursor for `(createdAt DESC, id DESC)` pagination. Encoded as
 * `<iso8601>|<kudoId>` for transport. Decoded into this shape inside the
 * service.
 */
export type KudoCursor = {
  createdAt: Date;
  id: KudoId;
};

export type KudoFeedPage = {
  items: Kudo[];
  nextCursor: string | null;
};
