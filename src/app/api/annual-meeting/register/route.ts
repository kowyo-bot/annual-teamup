import { NextResponse } from "next/server";

import { requireDb } from "@/db";
import { annualMeetingRegistrations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, message: "UNAUTHENTICATED" }, { status: 401 });

  const db = requireDb();
  await db
    .insert(annualMeetingRegistrations)
    .values({ userId: user.id, attending: true })
    .onConflictDoUpdate({
      target: annualMeetingRegistrations.userId,
      set: { attending: true },
    });

  return NextResponse.json({ ok: true });
}
