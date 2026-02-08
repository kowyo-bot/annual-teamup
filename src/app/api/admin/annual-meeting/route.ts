import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { requireDb } from "@/db";
import { annualMeetingRegistrations, users } from "@/db/schema";
import { isAdminSession } from "@/lib/admin";

export async function GET() {
  const ok = await isAdminSession();
  if (!ok) return NextResponse.json({ ok: false, message: "UNAUTHORIZED" }, { status: 401 });

  const db = requireDb();

  // Backfill: ensure all existing users have an annual meeting registration
  await db.execute(sql`
    INSERT INTO teamup_annual_meeting_registrations (user_id, attending)
    SELECT id, true FROM teamup_users u
    WHERE NOT EXISTS (
      SELECT 1 FROM teamup_annual_meeting_registrations r WHERE r.user_id = u.id
    )
  `);

  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      employeeId: users.employeeId,
      roleCategory: users.roleCategory,
      createdAt: annualMeetingRegistrations.createdAt,
    })
    .from(annualMeetingRegistrations)
    .innerJoin(users, eq(users.id, annualMeetingRegistrations.userId))
    .where(eq(annualMeetingRegistrations.attending, true))
    .orderBy(annualMeetingRegistrations.createdAt);

  return NextResponse.json({
    ok: true,
    rows: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
