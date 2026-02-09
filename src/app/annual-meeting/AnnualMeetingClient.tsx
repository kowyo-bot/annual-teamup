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
  const [showContestPrompt, setShowContestPrompt] = useState(true);

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
  }

  // If user has already made a choice
  if (registered && attending !== null) {
    if (attending) {
      return (
        <div className="space-y-4 text-center">
          <div className="text-sm text-green-600">
            ✓ 您已确认参加年会
          </div>
          {showContestPrompt ? (
            <div className="space-y-3">
              <div className="text-sm">报名参加趣味编码比赛不？</div>
              <div className="flex items-center justify-center gap-3">
                <a className="gala-btn min-w-[120px]" href="/contest-signup">
                  去报名
                </a>
                <button
                  className="gala-btn-outline min-w-[120px]"
                  onClick={() => setShowContestPrompt(false)}
                >
                  暂不
                </button>
              </div>
            </div>
          ) : null}
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
