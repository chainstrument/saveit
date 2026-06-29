import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookmarks, tags, bookmarkTags } from "@/db/schema";
import { CreateBookmarkSchema } from "@saveit/shared";
import { eq, and, desc, count } from "drizzle-orm";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { uploadScreenshot } from "@/lib/r2";

async function getSessionFromRequest() {
  return getSession(await headers());
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(req.url).searchParams;
  const urlFilter = params.get("url");
  const limit = Math.min(parseInt(params.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(params.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  const where = urlFilter
    ? and(eq(bookmarks.userId, session.user.id), eq(bookmarks.url, urlFilter))
    : eq(bookmarks.userId, session.user.id);

  const [rows, [{ total }]] = await Promise.all([
    db.query.bookmarks.findMany({
      where,
      with: { bookmarkTags: { with: { tag: true } } },
      orderBy: [desc(bookmarks.createdAt)],
      limit,
      offset,
    }),
    db.select({ total: count() }).from(bookmarks).where(where),
  ]);

  const result = rows.map((b) => ({
    ...b,
    tags: b.bookmarkTags.map((bt) => bt.tag),
    bookmarkTags: undefined,
  }));

  return NextResponse.json({
    data: result,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { url, title, note, tagNames, screenshot } = parsed.data;
  const bookmarkId = crypto.randomUUID();

  let screenshotUrl: string | null = null;
  if (screenshot) {
    if (process.env.R2_ACCESS_KEY_ID) {
      try {
        screenshotUrl = await uploadScreenshot(bookmarkId, screenshot);
      } catch {
        screenshotUrl = screenshot; // fallback base64
      }
    } else {
      screenshotUrl = screenshot; // stockage base64 direct en DB
    }
  }

  await db.insert(bookmarks).values({
    id: bookmarkId,
    userId: session.user.id,
    url,
    title,
    note: note ?? null,
    screenshotUrl,
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
