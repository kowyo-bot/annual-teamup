import { redirect } from "next/navigation";

import { isAdminSession } from "@/lib/admin";
import AdminLoginClient from "./AdminLoginClient";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const ok = await isAdminSession();
  if (ok) redirect("/admin");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-3xl">🔐</div>
        <h1 className="text-2xl gala-heading">管理员登录</h1>
        <AdminLoginClient />
      </div>
    </main>
  );
}
