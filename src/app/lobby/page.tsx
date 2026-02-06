import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">实时组队大厅</h1>
      {!user ? (
        <div className="space-y-2">
          <div className="text-sm text-neutral-600">未登录</div>
          <Link className="underline" href="/login">
            去登录
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm">已登录：{user.name}（{user.roleCategory}）</div>
          <div className="rounded border p-3 text-sm text-neutral-600">
            MVP 下一步实现：创建队伍 / 加入队伍（事务 + 并发锁）/ 退出队伍 / 实时更新。
          </div>
        </div>
      )}
    </main>
  );
}
