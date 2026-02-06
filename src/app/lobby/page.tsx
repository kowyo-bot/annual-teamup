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
    <main className="mx-auto max-w-6xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold">实时组队大厅</h1>
        {user ? (
          <div className="text-sm text-neutral-600">{user.name}</div>
        ) : null}
      </div>
      {!user ? (
        <div className="space-y-2">
          <div className="text-sm text-neutral-600">未注册/未登录</div>
          <Link className="underline" href="/register">
            去注册
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
          <LobbyData user={user} />
          <UserCard user={{ name: user.name, employeeId: user.employeeId, roleCategory: user.roleCategory }} />
        </div>
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
        user: { name: user.name, employeeId: user.employeeId, roleCategory: user.roleCategory },
        teams: list as any,
        myTeamId,
        membersByTeam,
      }}
    />
  );
}
