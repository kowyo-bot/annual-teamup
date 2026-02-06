import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { teamMembers, teams } from "@/db/schema";

type Db = PostgresJsDatabase<any>;

type Role = "RND" | "PRODUCT" | "GROWTH" | "ROOT";

type TeamCounts = {
  memberCount: number;
  rndCount: number;
  productCount: number;
  growthCount: number;
  rootCount: number;
};

export const DEFAULT_TEAM_IDS = Array.from({ length: 30 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`);

export async function ensureDefaultTeams(db: Db) {
  await db
    .insert(teams)
    .values(DEFAULT_TEAM_IDS.map((id) => ({ id })))
    .onConflictDoNothing();
}

export function roleDelta(role: Role) {
  return {
    memberCount: 1,
    rndCount: role === "RND" ? 1 : 0,
    productCount: role === "PRODUCT" ? 1 : 0,
    growthCount: role === "GROWTH" ? 1 : 0,
    rootCount: role === "ROOT" ? 1 : 0,
  };
}

export function canJoinTeam(current: TeamCounts, role: Role) {
  const d = roleDelta(role);

  const next = {
    memberCount: current.memberCount + d.memberCount,
    rndCount: current.rndCount + d.rndCount,
    productCount: current.productCount + d.productCount,
    growthCount: current.growthCount + d.growthCount,
    rootCount: current.rootCount + d.rootCount,
  };

  if (next.memberCount > 5) return { ok: false as const, message: "队伍已满" };
  if (next.rootCount > 1) return { ok: false as const, message: "ROOT 需要打散（每队最多 1 个）" };

  const slots = 5 - next.memberCount;
  const need =
    Math.max(0, 2 - next.rndCount) +
    Math.max(0, 1 - next.productCount) +
    Math.max(0, 1 - next.growthCount);

  if (need > slots) {
    return { ok: false as const, message: "该队伍已无法满足人员构成要求" };
  }

  if (next.memberCount === 5 && need !== 0) {
    return { ok: false as const, message: "满员后必须满足构成要求" };
  }

  return { ok: true as const, next };
}

export async function getMyTeamId(db: Db, userId: string) {
  const [m] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId))
    .limit(1);
  return m?.teamId ?? null;
}
