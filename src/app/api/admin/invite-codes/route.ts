import { NextResponse } from "next/server";

export async function POST() {
  // 邀码系统已取消
  return NextResponse.json(
    { ok: false, message: "邀请码系统已取消" },
    { status: 410 },
  );
}
