"use client";

import { useState } from "react";

type Role = "RND" | "PRODUCT" | "GROWTH" | "ROOT" | "FUNCTION";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleCategory, setRoleCategory] = useState<Role>("RND");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, roleCategory }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.message ?? "报名失败");
      return;
    }

    window.location.href = "/annual-meeting";
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl">🏮</div>
          <h1 className="text-2xl gala-heading">年会报名</h1>
          <p className="gala-muted text-sm">
            输入姓名、邮箱、角色后即可完成报名并进入实时组队大厅
          </p>
        </div>

        <form className="gala-card p-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/70">姓名</label>
            <input
              className="gala-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/70">邮箱</label>
            <input
              className="gala-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="@fuzhi.ai"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/70">角色</label>
            <select
              className="gala-input"
              value={roleCategory}
              onChange={(e) => setRoleCategory(e.target.value as Role)}
            >
              <option value="RND">研发（工程/算法）</option>
              <option value="PRODUCT">产品</option>
              <option value="GROWTH">增长</option>
              <option value="ROOT">ROOT</option>
              <option value="FUNCTION">职能</option>
            </select>
          </div>

          <div className="pt-2">
            <button disabled={loading} className="gala-btn w-full">
              {loading ? "报名中..." : "报名"}
            </button>
          </div>

          {msg ? (
            <div className="text-sm text-red-primary text-center">{msg}</div>
          ) : null}
        </form>
      </div>
    </main>
  );
}
