"use client";

import { useState } from "react";

export default function ContestSignupClient({ registered: initialRegistered }: { registered: boolean }) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    if (busy) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/contest-signup", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok || !data?.ok) {
      setError(data?.message ?? "报名失败");
      return;
    }

    setRegistered(true);
  }

  if (registered) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-green-600">✓ 您已报名编程比赛</div>
        <a className="gala-btn inline-block" href="/lobby">
          进入组队大厅
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button disabled={busy} className="gala-btn w-full" onClick={handleSignup}>
        {busy ? "报名中..." : "确认报名编程比赛"}
      </button>
      {error ? <div className="text-xs text-red-primary">⚠ {error}</div> : null}
    </div>
  );
}
