import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { requireDb } from "@/db";
import { sessions, users } from "@/db/schema";

const COOKIE_NAME = "teamup_session";

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const db = requireDb();
  const now = new Date();
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)));

  return row?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: "UNAUTHENTICATED" as const };
  }
  return { user, error: null };
}

export async function setSessionCookie(token: string, maxAgeSeconds: number) {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
