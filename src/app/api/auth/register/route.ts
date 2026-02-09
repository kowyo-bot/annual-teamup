import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setSessionCookie } from "@/lib/auth";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        name?: string;
        email?: string;
        roleCategory?: "RND" | "PRODUCT" | "GROWTH" | "ROOT" | "FUNCTION";
      }
    | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim()?.toLowerCase();
  const roleCategory = body?.roleCategory;

  if (!name || !email || !roleCategory) {
    return badRequest("缺少字段");
  }

  const db = requireDb();

  const result = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .for("update");

    const userId = existing?.id ?? crypto.randomUUID();

    if (existing) {
      await tx
        .update(users)
        .set({ name, roleCategory })
        .where(eq(users.id, userId));
    } else {
      await tx.insert(users).values({ id: userId, name, email, roleCategory });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const maxAgeSeconds = 60 * 60 * 24 * 14; // 14 days
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

    await tx.insert(sessions).values({ token, userId, expiresAt });

    return { ok: true as const, token, maxAgeSeconds };
  });

  await setSessionCookie(result.token, result.maxAgeSeconds);
  return NextResponse.json({ ok: true });
}
