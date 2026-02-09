"use client";

import { useState } from "react";

import AnnualMeetingClient from "./annual-meeting/AnnualMeetingClient";

type Role = "RND" | "PRODUCT" | "GROWTH" | "ROOT" | "FUNCTION";

type HomeClientProps = {
  user: { name: string; email: string } | null;
  initialRegistered: boolean;
  initialAttending: boolean | null;
};

export default function HomeClient({
  user,
  initialRegistered,
  initialAttending,
}: HomeClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleCategory, setRoleCategory] = useState<Role>("RND");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
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

    window.location.href = "/";
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="gala-card p-6 space-y-4 text-left">
        <div className="text-lg gala-heading">登录</div>
        {user ? (
          <div className="text-sm">
            已登录：
            <span className="text-red-primary font-medium">{user.name}</span>
            <span className="gala-muted text-xs break-all">（{user.email}）</span>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
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
                {loading ? "报名中..." : "登录"}
              </button>
            </div>

            {msg ? (
              <div className="text-sm text-red-primary text-center">{msg}</div>
            ) : null}
          </form>
        )}
      </div>

      {user && (
        <div className="gala-card p-6 space-y-4 text-center">
          <AnnualMeetingClient
            initialRegistered={initialRegistered}
            initialAttending={initialAttending ?? undefined}
          />
        </div>
      )}
    </div>
  );
}
