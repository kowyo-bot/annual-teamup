import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ContestSignupPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">编程比赛报名（提前报名）</h1>
      {!user ? (
        <div className="space-y-2">
          <div className="text-sm text-neutral-600">未登录</div>
          <Link className="underline" href="/login">
            去登录
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-neutral-600">
            说明：此处不披露具体流程设计和题目，仅完成预报名与组队。
          </div>
          <div className="text-sm">组队规则：4-5 人；研发≥2、产品≥1、增长≥1、ROOT≤1。</div>
          <Link className="underline" href="/lobby">
            进入实时组队大厅
          </Link>
        </div>
      )}
    </main>
  );
}
