import { NextResponse } from "next/server";

import { setAdminSessionCookie, validateAdminCredentials } from "@/lib/admin";

function badRequest(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  const username = body?.username?.trim();
  const password = body?.password?.trim();

  if (!username || !password) {
    return badRequest("缺少字段");
  }

  if (!validateAdminCredentials(username, password)) {
    return badRequest("账号或密码错误", 401);
  }

  await setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
