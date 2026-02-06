import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { sessions } from "@/db/schema";
import { clearSessionCookie } from "@/lib/auth";

const COOKIE_NAME = "teamup_session";

export async function POST() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;

  if (token) {
    const db = requireDb();
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
