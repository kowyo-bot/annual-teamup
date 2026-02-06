"use client";

import { useState } from "react";

type Role = "RND" | "PRODUCT" | "GROWTH" | "ROOT";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [roleCategory, setRoleCategory] = useState<Role>("RND");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/auth/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, name, employeeId, roleCategory }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data?.message ?? "登录失败");
      return;
    }
    window.location.href = "/annual-meeting";
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">邀请码登录</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="space-y-1">
          <div className="text-sm">邀请码</div>
          <input className="w-full border p-2" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm">姓名</div>
          <input className="w-full border p-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm">工号/ID</div>
          <input className="w-full border p-2" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm">角色</div>
          <select className="w-full border p-2" value={roleCategory} onChange={(e) => setRoleCategory(e.target.value as Role)}>
            <option value="RND">研发（工程/算法）</option>
            <option value="PRODUCT">产品</option>
            <option value="GROWTH">增长</option>
            <option value="ROOT">ROOT</option>
          </select>
          <div className="text-xs text-neutral-500">建议：ROOT 不要让用户自选，后续可改成邀请码固定角色。</div>
        </div>
        <button disabled={loading} className="border px-3 py-2">
          {loading ? "登录中..." : "登录"}
        </button>
        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </main>
  );
}
