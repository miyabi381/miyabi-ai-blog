import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { ensureSameOriginRequest } from "@/lib/security";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const csrfError = ensureSameOriginRequest(request);
  if (csrfError) {
    return csrfError;
  }

  clearAuthCookie();
  return NextResponse.redirect(new URL("/", request.url));
}
