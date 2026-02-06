import { NextResponse } from "next/server";

export async function POST() {
  // 邀码系统已取消
  return NextResponse.json(
    { ok: false, message: "邀请码登录已取消，请使用 /register（姓名/工号/角色）" },
    { status: 410 },
  );
}
