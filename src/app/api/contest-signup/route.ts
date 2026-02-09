import { NextResponse } from "next/server";

import { requireDb } from "@/db";
import { contestRegistrations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHENTICATED" }, { status: 401 });

  const db = requireDb();
  await db
    .insert(contestRegistrations)
    .values({ userId: user.id })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
