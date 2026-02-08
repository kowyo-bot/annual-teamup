"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok || !data?.ok) {
      setError(data?.message ?? "登录失败");
      return;
    }

    router.push("/admin");
  }

  return (
    <form className="gala-card p-6 space-y-4 text-left" onSubmit={submit}>
      <div className="space-y-2">
        <label className="text-xs gala-muted">用户名</label>
        <input
          className="gala-input w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs gala-muted">密码</label>
        <input
          className="gala-input w-full"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="123456"
        />
      </div>
      <button className="gala-btn w-full" disabled={busy}>
        {busy ? "登录中..." : "登录"}
      </button>
      {error ? <div className="text-xs text-red-primary">⚠ {error}</div> : null}
    </form>
  );
}
