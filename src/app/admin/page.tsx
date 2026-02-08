import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";

import { requireDb } from "@/db";
import { annualMeetingRegistrations, users } from "@/db/schema";
import { isAdminSession } from "@/lib/admin";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ok = await isAdminSession();
  if (!ok) redirect("/admin/login");

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

  const serializedRows = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-1">
          <div className="text-2xl gala-heading">管理员面板</div>
          <div className="text-xs gala-muted">年会报名数据来自数据库，比赛报名数据来自实时在线</div>
        </div>
        <AdminClient initialAnnualMeeting={serializedRows} />
      </div>
    </main>
  );
}
