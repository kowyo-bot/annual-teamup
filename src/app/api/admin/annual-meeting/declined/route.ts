import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { annualMeetingRegistrations, users } from "@/db/schema";
import { isAdminSession } from "@/lib/admin";

export async function GET() {
  const ok = await isAdminSession();
  if (!ok) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const db = requireDb();

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      roleCategory: users.roleCategory,
      createdAt: annualMeetingRegistrations.createdAt,
    })
    .from(annualMeetingRegistrations)
    .innerJoin(users, eq(users.id, annualMeetingRegistrations.userId))
    .where(eq(annualMeetingRegistrations.attending, false))
    .orderBy(annualMeetingRegistrations.createdAt);

  return NextResponse.json({
    ok: true,
    rows: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
