import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
export async function getSession(reqHeaders: Headers) {
  // Cookie (webapp)
  const cookieSession = await auth.api.getSession({ headers: reqHeaders });
  if (cookieSession) return cookieSession;

  // Bearer token (extension)
  const authHeader = reqHeaders.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const rows = await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    if (rows[0]) return { session: rows[0].session, user: rows[0].user };
  }

  return null;
}
