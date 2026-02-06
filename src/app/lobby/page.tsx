import Link from "next/link";

import { requireDb } from "@/db";
import { teamMembers, teams, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDefaultTeams, getMyTeamId } from "@/lib/teamup";
import { eq } from "drizzle-orm";

import LobbyClient from "./LobbyClient";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">实时组队大厅</h1>
      {!user ? (
        <div className="space-y-2">
          <div className="text-sm text-neutral-600">未注册/未登录</div>
          <Link className="underline" href="/register">
            去注册
          </Link>
        </div>
      ) : (
        <LobbyData userId={user.id} />
      )}
    </main>
  );
}

async function LobbyData({ userId }: { userId: string }) {
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

  const myTeamId = await getMyTeamId(db, userId);

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
        teams: list as any,
        myTeamId,
        membersByTeam,
      }}
    />
  );
}
