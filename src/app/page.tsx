import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-lg">
        {/* Decorative top */}
        <div className="text-5xl">🏮</div>

        <div className="space-y-3">
          <h1 className="text-4xl gala-heading tracking-wide">年会组队系统</h1>
          <p className="gala-muted text-sm leading-relaxed">
            年会报名 · 比赛报名 · 实时组队大厅
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-16 bg-linear-to-r from-transparent to-red-primary/20" />
          <div className="text-red-primary/40 text-xs">✦</div>
          <div className="h-px w-16 bg-linear-to-l from-transparent to-red-primary/20" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link className="gala-btn inline-block text-center min-w-[200px]" href="/annual-meeting">
            进入年会
          </Link>
          <Link className="gala-link text-sm" href="/lobby">
            直接进入组队大厅 →
          </Link>
        </div>

        {/* Bottom decoration */}
        <div className="gala-muted text-xs pt-4">
          🎊 欢迎参加年会活动 🎊
        </div>
      </div>
    </main>
  );
}
