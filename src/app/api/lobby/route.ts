import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { teamMembers, teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDefaultTeams, getMyTeamId } from "@/lib/teamup";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHENTICATED" }, { status: 401 });

  const db = requireDb();
  await ensureDefaultTeams(db);

  const list = await db
    .select({
      id: teams.id,
      memberCount: teams.memberCount,
      rndCount: teams.rndCount,
      productCount: teams.productCount,
      growthCount: teams.growthCount,
      rootCount: teams.rootCount,
      status: teams.status,
    })
    .from(teams)
    .orderBy(teams.id);

  const myTeamId = await getMyTeamId(db, user.id);

  const members = await db
    .select({
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      name: users.name,
      roleCategory: users.roleCategory,
    })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId));

  const membersByTeam: Record<string, Array<{ userId: string; name: string; roleCategory: string }>> = {};
  for (const m of members) {
    (membersByTeam[m.teamId] ??= []).push({
      userId: m.userId,
      name: m.name,
      roleCategory: m.roleCategory,
    });
  }

  // keep stable ordering for UI
  for (const k of Object.keys(membersByTeam)) {
    membersByTeam[k].sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
  }

  return NextResponse.json({ ok: true, user, myTeamId, teams: list, membersByTeam });
}
