"use client";

import { useState } from "react";

export default function UserCard({
  user,
}: {
  user: { name: string; employeeId: string; roleCategory: string };
}) {
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
    <div className="rounded border p-3 text-sm min-w-[220px]">
      <div className="font-medium">{user.name}</div>
      <div className="text-neutral-600">{user.employeeId}</div>
      <div className="text-neutral-600">Role: {user.roleCategory}</div>
      <div className="pt-2">
        <button disabled={loading} className="border px-3 py-2 text-sm" onClick={logout}>
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
