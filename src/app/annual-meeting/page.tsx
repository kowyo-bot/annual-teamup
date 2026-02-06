import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AnnualMeetingPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="text-3xl">🎊</div>
        <h1 className="text-2xl gala-heading">年会报名</h1>

        {!user ? (
          <div className="gala-card p-6 space-y-4">
            <p className="gala-muted text-sm">您尚未报名或登录</p>
            <Link className="gala-btn inline-block" href="/register">
              去报名
            </Link>
          </div>
        ) : (
          <div className="gala-card p-6 space-y-5">
            <div className="text-sm">
              你好，<span className="text-red-primary font-medium">{user.name}</span>
              <span className="gala-muted">（{user.employeeId}）</span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Link className="gala-btn inline-block" href="/contest-signup">
                去比赛报名
              </Link>
              <Link className="gala-btn-outline inline-block" href="/lobby">
                进入组队大厅
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
