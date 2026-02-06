import Link from "next/link";

import { requireDb } from "@/db";
import { teamMembers, teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDefaultTeams, getMyTeamId } from "@/lib/teamup";
import { eq } from "drizzle-orm";

import LobbyClient from "./LobbyClient";
import UserCard from "./UserCard";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏮</span>
          <h1 className="text-xl gala-heading">实时组队大厅</h1>
        </div>
        {user ? (
          <UserCard
            user={{
              name: user.name,
              employeeId: user.employeeId,
              roleCategory: user.roleCategory,
            }}
          />
        ) : null}
      </div>
      {!user ? (
        <div className="gala-card p-6 space-y-3">
          <div className="gala-muted text-sm">未报名/未登录</div>
          <Link className="gala-btn inline-block" href="/register">
            去报名
          </Link>
        </div>
      ) : (
        <LobbyData user={user} />
      )}
    </main>
  );
}

async function LobbyData({ user }: { user: { id: string; name: string; employeeId: string; roleCategory: string } }) {
  const db = requireDb();
  await ensureDefaultTeams(db);

  const list = await db
    .select({
      id: teams.id,
      status: teams.status,
      memberCount: teams.memberCount,
      rndCount: teams.rndCount,
      productCount: teams.productCount,
      growthCount: teams.growthCount,
      rootCount: teams.rootCount,
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

  for (const k of Object.keys(membersByTeam)) {
    membersByTeam[k].sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
  }

  return (
    <LobbyClient
      initial={{
        userId: user.id,
        user: { name: user.name, employeeId: user.employeeId, roleCategory: user.roleCategory },
        teams: list as any,
        myTeamId,
        membersByTeam,
      }}
    />
  );
}
