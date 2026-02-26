import { NextResponse, type NextRequest } from "next/server";

function parseUrl(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function ensureSameOriginRequest(request: NextRequest) {
  const origin = parseUrl(request.headers.get("origin"));
  const referer = parseUrl(request.headers.get("referer"));
  const requestOrigin = new URL(request.url).origin;

  if (origin && origin.origin !== requestOrigin) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403 });
  }

  if (!origin && referer && referer.origin !== requestOrigin) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403 });
  }

  if (!origin && !referer) {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403 });
  }

  return null;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim();
}
