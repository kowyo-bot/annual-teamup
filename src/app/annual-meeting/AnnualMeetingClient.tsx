"use client";

import { useState } from "react";

export default function AnnualMeetingClient({
  initialRegistered,
  initialAttending,
}: {
  initialRegistered: boolean;
  initialAttending?: boolean;
}) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [attending, setAttending] = useState<boolean | null>(initialAttending ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegret, setShowRegret] = useState(false);

  async function handleAttendingChoice(willAttend: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/annual-meeting/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attending: willAttend }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok || !data?.ok) {
      setError(data?.message ?? "提交失败");
      return;
    }

    setRegistered(true);
    setAttending(willAttend);
    setShowRegret(false);
  }

  // If user has already made a choice
  if (registered && attending !== null) {
    if (attending) {
      return (
        <div className="space-y-4 text-center">
          <div className="text-sm text-green-600">
            ✓ 您已确认参加年会
          </div>
          <div className="flex items-center justify-center">
            <a className="gala-btn min-w-[120px]" href="/contest-signup">
              去报名参加趣味编码比赛
            </a>
          </div>

          {!showRegret ? (
            <button
              className="text-xs gala-muted underline underline-offset-2 hover:text-red-primary transition-colors mt-2"
              onClick={() => setShowRegret(true)}
            >
              让我再想想，还是不想参加年会了
            </button>
          ) : (
            <div className="space-y-2 mt-2 pt-3 border-t gala-divider">
              <div className="text-sm font-medium">确定要改为不参加年会吗？</div>
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={busy}
                  className="gala-btn text-xs min-w-[80px]"
                  onClick={() => handleAttendingChoice(false)}
                >
                  {busy ? "提交中..." : "确认不参加"}
                </button>
                <button
                  disabled={busy}
                  className="gala-btn-outline text-xs min-w-[80px]"
                  onClick={() => setShowRegret(false)}
                >
                  取消
                </button>
              </div>
              {error ? <div className="text-xs text-red-primary">⚠ {error}</div> : null}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-3 text-center">
          <div className="text-sm gala-muted">
            好的，同学，请联络HR 宋南星领取春节礼盒！
          </div>
          <div className="text-xs text-red-primary/60">
            🎁 祝您春节快乐！
          </div>

          {!showRegret ? (
            <button
              className="text-xs gala-muted underline underline-offset-2 hover:text-red-primary transition-colors mt-2"
              onClick={() => setShowRegret(true)}
            >
              我反悔了，想参加年会
            </button>
          ) : (
            <div className="space-y-2 mt-2 pt-3 border-t gala-divider">
              <div className="text-sm font-medium">确定要改为参加年会吗？</div>
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={busy}
                  className="gala-btn text-xs min-w-[80px]"
                  onClick={() => handleAttendingChoice(true)}
                >
                  {busy ? "提交中..." : "确认参加"}
                </button>
                <button
                  disabled={busy}
                  className="gala-btn-outline text-xs min-w-[80px]"
                  onClick={() => setShowRegret(false)}
                >
                  取消
                </button>
              </div>
              {error ? <div className="text-xs text-red-primary">⚠ {error}</div> : null}
            </div>
          )}
        </div>
      );
    }
  }

  // Show the question
  return (
    <div className="space-y-4">
      <div className="text-base font-medium">
        是否参加年会？
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          disabled={busy}
          className="gala-btn min-w-[100px]"
          onClick={() => handleAttendingChoice(true)}
        >
          {busy ? "提交中..." : "是"}
        </button>
        <button
          disabled={busy}
          className="gala-btn-outline min-w-[100px]"
          onClick={() => handleAttendingChoice(false)}
        >
          {busy ? "提交中..." : "否"}
        </button>
      </div>
      {error ? <div className="text-xs text-red-primary">⚠ {error}</div> : null}
    </div>
  );
}
