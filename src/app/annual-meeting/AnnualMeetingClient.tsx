"use client";

import { useState } from "react";

export default function AnnualMeetingClient({
  initialRegistered,
}: {
  initialRegistered: boolean;
}) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signup() {
    if (registered || busy) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/annual-meeting/register", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok || !data?.ok) {
      setError(data?.message ?? "报名失败");
      return;
    }

    setRegistered(true);
  }

  return (
    <div className="space-y-3">
      <div className="text-xs">
        报名状态：{registered ? <span className="text-green-600">已报名</span> : "未报名"}
      </div>
      <button disabled={registered || busy} className="gala-btn" onClick={signup}>
        {registered ? "已报名" : busy ? "提交中..." : "确认报名年会"}
      </button>
      {error ? <div className="text-xs text-red-primary">⚠ {error}</div> : null}
    </div>
  );
}
