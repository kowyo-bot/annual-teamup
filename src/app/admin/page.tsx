import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";

import { requireDb } from "@/db";
import { annualMeetingRegistrations, contestRegistrations, teamMembers, users } from "@/db/schema";
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
      email: users.email,
      roleCategory: users.roleCategory,
      createdAt: annualMeetingRegistrations.createdAt,
    })
    .from(annualMeetingRegistrations)
    .innerJoin(users, eq(users.id, annualMeetingRegistrations.userId))
    .where(eq(annualMeetingRegistrations.attending, true))
    .orderBy(annualMeetingRegistrations.createdAt);

  const declinedRows = await db
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

  const serializedRows = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const serializedDeclinedRows = declinedRows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  const [{ count: teamSignupCount }] = await db
    .select({ count: sql<number>`count(distinct ${teamMembers.userId})` })
    .from(teamMembers);

  const contestRows = await db
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

  const serializedContestRows = contestRows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-1">
          <div className="text-2xl gala-heading">年会系统后台</div>
        </div>
        <AdminClient
          initialAnnualMeeting={serializedRows}
          initialDeclined={serializedDeclinedRows}
          initialTeamSignupCount={Number(teamSignupCount ?? 0)}
          initialContestSignups={serializedContestRows}
        />
      </div>
    </main>
  );
}
