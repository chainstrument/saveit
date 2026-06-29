import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookmarks, tags, bookmarkTags } from "@/db/schema";
import { CreateBookmarkSchema } from "@saveit/shared";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";

async function getSessionFromRequest() {
  return getSession(await headers());
}

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.bookmarks.findMany({
    where: eq(bookmarks.userId, session.user.id),
    with: {
      bookmarkTags: { with: { tag: true } },
    },
    orderBy: [desc(bookmarks.createdAt)],
  });

  const result = rows.map((b) => ({
    ...b,
    tags: b.bookmarkTags.map((bt) => bt.tag),
    bookmarkTags: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { url, title, note, tagNames } = parsed.data;
  const bookmarkId = crypto.randomUUID();

  await db.insert(bookmarks).values({
    id: bookmarkId,
    userId: session.user.id,
    url,
    title,
    note: note ?? null,
  });

  if (tagNames.length > 0) {
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

      await db.insert(bookmarkTags).values({ bookmarkId, tagId: tag.id });
    }
  }

  return NextResponse.json({ id: bookmarkId }, { status: 201 });
}
