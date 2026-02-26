import { NextResponse, type NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

function getClientIp(request: NextRequest) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
}

function getStore() {
  const globalWithStore = globalThis as typeof globalThis & {
    __miyabiRateLimitStore?: Map<string, Bucket>;
  };
  if (!globalWithStore.__miyabiRateLimitStore) {
    globalWithStore.__miyabiRateLimitStore = new Map<string, Bucket>();
  }
  return globalWithStore.__miyabiRateLimitStore;
}

export function enforceRateLimit(request: NextRequest, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = `${scope}:${ip}`;
  const store = getStore();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらくしてから再試行してください。" }, { status: 429 });
  }

  current.count += 1;
  return null;
}
