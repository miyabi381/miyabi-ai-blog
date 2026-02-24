import { NextResponse, type NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  clearAuthCookie();
  return NextResponse.redirect(new URL("/", request.url));
}
