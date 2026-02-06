import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">TeamUp</h1>
      <p className="text-sm text-neutral-600">
        年会报名 → 比赛报名 → 实时组队大厅（不公开题目/流程细节）
      </p>
      <div className="flex gap-3">
        <Link className="underline" href="/annual-meeting">
          年会报名
        </Link>
        <Link className="underline" href="/lobby">
          组队大厅
        </Link>
      </div>
      <p className="text-xs text-neutral-500">
        说明：本项目是 MVP 骨架，API 与数据表已准备好，可继续补齐年会/比赛报名与组队逻辑。
      </p>
    </main>
  );
}
