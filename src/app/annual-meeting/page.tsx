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
          <div className="text-sm text-neutral-600">未登录</div>
          <Link className="underline" href="/login">
            去登录
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm">你好，{user.name}（{user.employeeId}）</div>
          <div className="text-sm text-neutral-600">MVP 先把页面搭起来，下一步把“是否参加年会”写入数据库。</div>
          <Link className="underline" href="/contest-signup">
            去比赛报名
          </Link>
        </div>
      )}
    </main>
  );
}
