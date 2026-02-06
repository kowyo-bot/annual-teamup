import { redirect } from "next/navigation";

export default function LoginPage() {
  // 邀码系统已取消：统一走 /register
  redirect("/register");
}
