import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireDb } from "@/db";
import { inviteCodes } from "@/db/schema";

function unauthorized() {
  return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const adminKey = process.env.TEAMUP_ADMIN_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { ok: false, message: "TEAMUP_ADMIN_KEY is not set" },
      { status: 500 },
    );
  }

  const headerKey = req.headers.get("x-admin-key") ?? "";
  if (headerKey.length !== adminKey.length) return unauthorized();
  // basic timing-safe compare
  const ok = crypto.timingSafeEqual(Buffer.from(headerKey), Buffer.from(adminKey));
  if (!ok) return unauthorized();

  const body = (await req.json().catch(() => null)) as
    | {
        count?: number;
        maxUses?: number;
        fixedRoleCategory?: "RND" | "PRODUCT" | "GROWTH" | "ROOT";
        expiresAt?: string;
      }
    | null;

  const count = Math.min(Math.max(body?.count ?? 10, 1), 200);
  const maxUses = Math.min(Math.max(body?.maxUses ?? 1, 1), 100);
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;

  const db = requireDb();

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(8).toString("base64url"));
  }

  await db
    .insert(inviteCodes)
    .values(
      codes.map((code) => ({
        code,
        maxUses,
        fixedRoleCategory: body?.fixedRoleCategory,
        expiresAt: expiresAt ?? undefined,
      })),
    )
    // ignore conflicts so we can retry
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, codes });
}
