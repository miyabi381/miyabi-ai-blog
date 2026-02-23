import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken, type SessionPayload } from "@/lib/jwt";

export async function getSessionUser(): Promise<SessionPayload | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

