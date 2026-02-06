"use client";

import { useState } from "react";

export default function UserCard({
  user,
}: {
  user: { name: string; employeeId: string; roleCategory: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/register";
    }
  }

  return (
    <div
      className="rounded border p-3 text-sm min-w-[220px] cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{user.name}</div>
        <div className="text-neutral-400 text-[10px]">{expanded ? "收起" : "展开"}</div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1 pt-2 border-t border-neutral-100">
          <div className="text-neutral-600">工号: {user.employeeId}</div>
          <div className="text-neutral-600">角色: {user.roleCategory}</div>
          <div className="pt-2">
            <button
              disabled={loading}
              className="border px-3 py-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
            >
              {loading ? "退出登录..." : "退出登录"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
