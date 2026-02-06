import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">TeamUp</h1>
      <p className="text-sm text-neutral-600">年会报名 → 比赛报名 → 实时组队大厅</p>
      <div className="flex gap-3">
        <Link className="underline" href="/annual-meeting">
          年会报名
        </Link>
      </div>
    </main>
  );
}
