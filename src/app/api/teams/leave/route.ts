import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { teamMembers, teams } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureDefaultTeams, roleDelta } from "@/lib/teamup";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHENTICATED" }, { status: 401 });

  const db = requireDb();
  await ensureDefaultTeams(db);

  const result = await db.transaction(async (tx) => {
    const [m] = await tx
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1)
      .for("update");

    if (!m) return { ok: true as const };

    const [t] = await tx
      .select()
      .from(teams)
      .where(eq(teams.id, m.teamId))
      .limit(1)
      .for("update");

    if (!t) {
      await tx.delete(teamMembers).where(eq(teamMembers.userId, user.id));
      return { ok: true as const };
    }

    if (t.status === "locked") return { ok: false as const, message: "队伍已锁定，无法退出" };

    await tx.delete(teamMembers).where(eq(teamMembers.userId, user.id));

    const d = roleDelta(m.roleCategory as any);

    await tx
      .update(teams)
      .set({
        memberCount: Math.max(0, t.memberCount - d.memberCount),
        rndCount: Math.max(0, t.rndCount - d.rndCount),
        productCount: Math.max(0, t.productCount - d.productCount),
        growthCount: Math.max(0, t.growthCount - d.growthCount),
        rootCount: Math.max(0, t.rootCount - d.rootCount),
      })
      .where(eq(teams.id, t.id));

    return { ok: true as const };
  });

  if (!result.ok) return NextResponse.json({ ok: false, message: result.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
