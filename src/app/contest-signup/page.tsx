import Link from "next/link";
import { eq } from "drizzle-orm";

import { requireDb } from "@/db";
import { contestRegistrations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import ContestSignupClient from "./ContestSignupClient";

export const dynamic = "force-dynamic";

export default async function ContestSignupPage() {
  const user = await getCurrentUser();
  const db = user ? requireDb() : null;
  const [registration] = user
    ? await db!
        .select({ status: contestRegistrations.status })
        .from(contestRegistrations)
        .where(eq(contestRegistrations.userId, user.id))
        .limit(1)
    : [];

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="text-3xl">🏆</div>
        <h1 className="text-2xl gala-heading">趣味编码比赛报名</h1>

        {!user ? (
          <div className="gala-card p-6 space-y-4">
            <p className="gala-muted text-sm">您尚未报名或登录</p>
            <Link className="gala-btn inline-block" href="/register">
              去报名
            </Link>
          </div>
        ) : (
          <div className="gala-card p-6 space-y-4">
            <div className="rounded-lg bg-red-primary/5 border border-red-primary/10 p-3 text-sm text-left">
              <span className="text-red-primary text-xs font-medium">组队规则</span>
              <p className="gala-muted text-xs mt-1">
                4-5 人；研发≥2、产品≥1、增长≥1、ROOT≤1
              </p>
            </div>

            <ContestSignupClient registered={!!registration} />
          </div>
        )}
      </div>
    </main>
  );
}
