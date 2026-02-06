"use client";

import { useState } from "react";

type Role = "RND" | "PRODUCT" | "GROWTH" | "ROOT";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
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
      body: JSON.stringify({ name, employeeId, roleCategory }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.message ?? "注册失败");
      return;
    }

    window.location.href = "/lobby";
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-xl font-semibold">注册</h1>
      <p className="text-sm text-neutral-600">输入姓名、工号、角色后即可进入实时组队大厅。</p>

      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="space-y-1">
          <div className="text-sm">姓名</div>
          <input
            className="w-full border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="张三"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm">工号/ID</div>
          <input
            className="w-full border p-2"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="E12345"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm">角色</div>
          <select
            className="w-full border p-2"
            value={roleCategory}
            onChange={(e) => setRoleCategory(e.target.value as Role)}
          >
            <option value="RND">研发（工程/算法）</option>
            <option value="PRODUCT">产品</option>
            <option value="GROWTH">增长</option>
            <option value="ROOT">ROOT</option>
          </select>
        </div>

        <button disabled={loading} className="border px-3 py-2">
          {loading ? "提交中..." : "进入大厅"}
        </button>

        {msg ? <div className="text-sm text-red-600">{msg}</div> : null}
      </form>
    </main>
  );
}
