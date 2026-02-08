import { cookies } from "next/headers";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "123456";
const ADMIN_COOKIE_NAME = "teamup_admin_session";
const ADMIN_COOKIE_VALUE = "ok";

export function validateAdminCredentials(username: string, password: string) {
  return username === ADMIN_USER && password === ADMIN_PASSWORD;
}

export async function isAdminSession() {
  const c = await cookies();
  return c.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}

export async function setAdminSessionCookie() {
  const c = await cookies();
  c.set({
    name: ADMIN_COOKIE_NAME,
    value: ADMIN_COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSessionCookie() {
  const c = await cookies();
  c.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
