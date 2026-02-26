import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { getFollowState, toggleFollow } from "@/lib/data";

export const runtime = "edge";

function parseTargetUserId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as { targetUserId?: unknown };
    const targetUserId = parseTargetUserId(body.targetUserId);
    if (!targetUserId) {
      return NextResponse.json({ error: "対象ユーザーが不正です。" }, { status: 400 });
    }
    if (targetUserId === auth.session.userId) {
      return NextResponse.json({ error: "自分自身はフォローできません。" }, { status: 400 });
    }

    const db = await getDb();
    const target = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!target[0]) {
      return NextResponse.json({ error: "対象ユーザーが見つかりません。" }, { status: 404 });
    }

    try {
      const active = await toggleFollow(auth.session.userId, targetUserId);
      const state = await getFollowState(auth.session.userId, targetUserId);
      return NextResponse.json({ active, ...state });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("no such table")) {
        return NextResponse.json(
          { error: "フォロー機能を使うには最新のデータベースマイグレーションを適用してください。" },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
