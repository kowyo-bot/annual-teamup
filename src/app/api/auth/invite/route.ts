import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { inviteCodes, sessions, users } from "@/db/schema";
import { and, eq, isNull, lt } from "drizzle-orm";
import { setSessionCookie } from "@/lib/auth";
import crypto from "node:crypto";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        code?: string;
        name?: string;
        employeeId?: string;
        roleCategory?: "RND" | "PRODUCT" | "GROWTH" | "ROOT";
      }
    | null;

  if (!body?.code || !body?.name || !body?.employeeId) {
    return badRequest("Missing fields");
  }

  const now = new Date();

  const db = requireDb();

  const result = await db.transaction(async (tx) => {
    const [codeRow] = await tx
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, body.code!))
      .limit(1)
      .for("update");

    if (!codeRow) return { ok: false as const, message: "邀请码无效" };
    if (codeRow.expiresAt && codeRow.expiresAt < now)
      return { ok: false as const, message: "邀请码已过期" };
    if (codeRow.usedCount >= codeRow.maxUses)
      return { ok: false as const, message: "邀请码已被使用" };

    const finalRole = codeRow.fixedRoleCategory ?? body.roleCategory;
    if (!finalRole) return { ok: false as const, message: "请选择角色" };

    // Upsert user by employeeId (simple binding model)
    const [existing] = await tx
      .select()
      .from(users)
      .where(eq(users.employeeId, body.employeeId!))
      .limit(1)
      .for("update");

    const userId = existing?.id ?? crypto.randomUUID();

    if (existing) {
      await tx
        .update(users)
        .set({ name: body.name!, roleCategory: finalRole })
        .where(eq(users.id, userId));
    } else {
      await tx.insert(users).values({
        id: userId,
        name: body.name!,
        employeeId: body.employeeId!,
        roleCategory: finalRole,
      });
    }

    await tx
      .update(inviteCodes)
      .set({ usedCount: codeRow.usedCount + 1 })
      .where(eq(inviteCodes.code, body.code!));

    const token = crypto.randomBytes(32).toString("hex");
    const maxAgeSeconds = 60 * 60 * 24 * 14; // 14 days
    const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

    await tx.insert(sessions).values({ token, userId, expiresAt });

    return { ok: true as const, token, maxAgeSeconds };
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  await setSessionCookie(result.token, result.maxAgeSeconds);
  return NextResponse.json({ ok: true });
}
