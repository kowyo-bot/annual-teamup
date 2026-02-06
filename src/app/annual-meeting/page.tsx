import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AnnualMeetingPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">年会报名</h1>
      {!user ? (
        <div className="space-y-2">
          <div className="text-sm text-neutral-600">未注册/未登录</div>
          <Link className="underline" href="/register">
            去注册
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm">你好，{user.name}（{user.employeeId}）</div>

          <div className="flex gap-3">
            <Link className="underline" href="/contest-signup">
              去比赛报名
            </Link>
            <Link className="underline" href="/lobby">
              进入组队大厅
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
