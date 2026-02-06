import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { teams } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDefaultTeams, getMyTeamId } from "@/lib/teamup";

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

  return NextResponse.json({ ok: true, user, myTeamId, teams: list });
}
