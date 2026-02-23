import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, createToken, type SessionPayload } from "@/lib/jwt";

const isProd = process.env.NODE_ENV === "production";

export async function issueAuthCookie(session: SessionPayload) {
  const token = await createToken(session);
  cookies().set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE
  });
  return token;
}

export function clearAuthCookie() {
  cookies().set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function getTokenFromRequest(request: NextRequest) {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}
