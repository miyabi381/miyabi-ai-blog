import { NextResponse, type NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { verifyToken, type SessionPayload } from "@/lib/jwt";

type AuthOk = {
  ok: true;
  session: SessionPayload;
};

type AuthFail = {
  ok: false;
  response: NextResponse;
};

export async function requireAuth(request: NextRequest): Promise<AuthOk | AuthFail> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "認証が必要です。" }, { status: 401 })
    };
  }

  try {
    const session = await verifyToken(token);
    return { ok: true, session };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "認証が必要です。" }, { status: 401 })
    };
  }
}
