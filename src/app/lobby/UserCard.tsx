"use client";

import { useState } from "react";

const ROLE_LABEL: Record<string, string> = {
  RND: "研发",
  PRODUCT: "产品",
  GROWTH: "增长",
  ROOT: "ROOT",
};

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
      className="gala-card p-3 text-sm min-w-[220px] cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-gold">{user.name}</div>
        <div className="gala-muted text-[10px]">{expanded ? "收起" : "展开"}</div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5 pt-2 border-t gala-divider">
          <div className="gala-muted">工号: {user.employeeId}</div>
          <div className="gala-muted">
            角色: <span className="text-gold/80">{ROLE_LABEL[user.roleCategory] ?? user.roleCategory}</span>
          </div>
          <div className="pt-2">
            <button
              disabled={loading}
              className="gala-btn-outline text-xs py-1! px-3!"
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
