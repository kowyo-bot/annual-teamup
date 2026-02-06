import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { teamMembers, teams } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canJoinTeam, ensureDefaultTeams, getMyTeamId } from "@/lib/teamup";

export async function POST(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHENTICATED" }, { status: 401 });

  const { teamId } = await params;

  const db = requireDb();
  await ensureDefaultTeams(db);

  const result = await db.transaction(async (tx) => {
    const existingMy = await getMyTeamId(tx as any, user.id);
    if (existingMy) {
      if (existingMy === teamId) return { ok: true as const, myTeamId: existingMy };
      return { ok: false as const, message: `你已在队伍 ${existingMy}` };
    }

    const [t] = await tx
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)
      .for("update");

    if (!t) return { ok: false as const, message: "队伍不存在" };
    if (t.status === "locked") return { ok: false as const, message: "队伍已锁定" };

    const check = canJoinTeam(
      {
        memberCount: t.memberCount,
        rndCount: t.rndCount,
        productCount: t.productCount,
        growthCount: t.growthCount,
        rootCount: t.rootCount,
      },
      user.roleCategory as any,
    );

    if (!check.ok) return { ok: false as const, message: check.message };

    await tx.insert(teamMembers).values({
      teamId,
      userId: user.id,
      roleCategory: user.roleCategory as any,
    });

    await tx
      .update(teams)
      .set({
        memberCount: check.next.memberCount,
        rndCount: check.next.rndCount,
        productCount: check.next.productCount,
        growthCount: check.next.growthCount,
        rootCount: check.next.rootCount,
      })
      .where(eq(teams.id, teamId));

    return { ok: true as const, myTeamId: teamId };
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, myTeamId: result.myTeamId });
}
