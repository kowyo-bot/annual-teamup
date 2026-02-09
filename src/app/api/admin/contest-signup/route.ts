import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { contestRegistrations, teamMembers, users } from "@/db/schema";
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
      status: contestRegistrations.status,
      teamId: teamMembers.teamId,
      createdAt: contestRegistrations.createdAt,
    })
    .from(contestRegistrations)
    .innerJoin(users, eq(users.id, contestRegistrations.userId))
    .leftJoin(teamMembers, eq(teamMembers.userId, contestRegistrations.userId))
    .orderBy(contestRegistrations.createdAt);

  return NextResponse.json({
    ok: true,
    rows: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
