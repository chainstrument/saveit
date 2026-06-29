import { z } from "zod";

export const TagSchema = z.object({
  id: z.string().cuid2(),
  name: z.string().min(1).max(50),
  userId: z.string().cuid2(),
  createdAt: z.coerce.date(),
});

export const BookmarkSchema = z.object({
  id: z.string().cuid2(),
  userId: z.string().cuid2(),
  url: z.string().url(),
  title: z.string().min(1).max(500),
  note: z.string().max(2000).nullable(),
  screenshotUrl: z.string().url().nullable().optional(),
  tags: z.array(TagSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(500),
  note: z.string().max(2000).optional(),
  tagNames: z.array(z.string().min(1).max(50)).max(20).default([]),
  screenshot: z.string().optional(),
});

export const UpdateBookmarkSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  note: z.string().max(2000).nullable().optional(),
  tagNames: z.array(z.string().min(1).max(50)).max(20).optional(),
});

export type Tag = z.infer<typeof TagSchema>;
export type Bookmark = z.infer<typeof BookmarkSchema>;
export type CreateBookmark = z.infer<typeof CreateBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof UpdateBookmarkSchema>;
