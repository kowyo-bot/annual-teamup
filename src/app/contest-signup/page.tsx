import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ContestSignupPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="text-3xl">🏆</div>
        <h1 className="text-2xl gala-heading">编程比赛报名</h1>
        <p className="gala-muted text-xs">提前报名</p>

        {!user ? (
          <div className="gala-card p-6 space-y-4">
            <p className="gala-muted text-sm">您尚未报名或登录</p>
            <Link className="gala-btn inline-block" href="/register">
              去报名
            </Link>
          </div>
        ) : (
          <div className="gala-card p-6 space-y-4 text-left">
            <p className="gala-muted text-sm">
              说明：此处不披露具体流程设计和题目，仅完成预报名与组队。
            </p>
            <div className="rounded-lg bg-red-primary/5 border border-red-primary/10 p-3 text-sm">
              <span className="text-red-primary text-xs font-medium">组队规则</span>
              <p className="gala-muted text-xs mt-1">
                4-5 人；研发≥2、产品≥1、增长≥1、ROOT≤1
              </p>
            </div>
            <div className="text-center pt-2">
              <Link className="gala-btn inline-block" href="/lobby">
                进入实时组队大厅
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
