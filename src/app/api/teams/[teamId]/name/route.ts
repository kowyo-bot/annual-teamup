import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { teamMembers, teams } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDefaultTeams } from "@/lib/teamup";

export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHENTICATED" }, { status: 401 });

  const { teamId } = await params;
  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json({ ok: false, message: "队名不能为空" }, { status: 400 });
  }
  if (name.length > 32) {
    return NextResponse.json({ ok: false, message: "队名最多 32 字" }, { status: 400 });
  }

  const db = requireDb();
  await ensureDefaultTeams(db);

  const result = await db.transaction(async (tx) => {
    const [team] = await tx
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)
      .for("update");

    if (!team) return { ok: false as const, status: 404, message: "队伍不存在" };

    const [member] = await tx
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id)))
      .limit(1);

    if (!member) return { ok: false as const, status: 403, message: "只有队伍成员可修改队名" };

    await tx.update(teams).set({ name }).where(eq(teams.id, teamId));
    return { ok: true as const };
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ ok: true, name });
}
