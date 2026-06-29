import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookmarks, tags, bookmarkTags } from "@/db/schema";
import { UpdateBookmarkSchema } from "@saveit/shared";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";

async function getSessionFromRequest() {
  return getSession(await headers());
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, note, tagNames } = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates["title"] = title;
  if (note !== undefined) updates["note"] = note;

  await db
    .update(bookmarks)
    .set(updates)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, session.user.id)));

  if (tagNames !== undefined) {
    await db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id));

    for (const name of tagNames) {
      const normalizedName = name.toLowerCase();
      let [tag] = await db
        .select()
        .from(tags)
        .where(and(eq(tags.userId, session.user.id), eq(tags.name, normalizedName)))
        .limit(1);

      if (!tag) {
        const tagId = crypto.randomUUID();
        await db.insert(tags).values({ id: tagId, userId: session.user.id, name: normalizedName });
        tag = { id: tagId, userId: session.user.id, name: normalizedName, createdAt: new Date() };
      }

      await db.insert(bookmarkTags).values({ bookmarkId: id, tagId: tag.id });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
