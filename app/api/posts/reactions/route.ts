import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { posts } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { getPostReactionSummary, togglePostReaction } from "@/lib/data";

export const runtime = "edge";

function parsePostId(value: string | null) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseKind(value: unknown): "like" | "favorite" | null {
  return value === "like" || value === "favorite" ? value : null;
}

export async function GET(request: NextRequest) {
  const postId = parsePostId(request.nextUrl.searchParams.get("postId"));
  if (!postId) {
    return NextResponse.json({ error: "投稿IDが不正です。" }, { status: 400 });
  }

  const db = await getDb();
  const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post[0]) {
    return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
  }

  const auth = await requireAuth(request);
  const summary = await getPostReactionSummary(postId, auth.ok ? auth.session.userId : null);
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as { postId?: unknown; kind?: unknown };
    const postId = Number(body.postId);
    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: "投稿IDが不正です。" }, { status: 400 });
    }

    const kind = parseKind(body.kind);
    if (!kind) {
      return NextResponse.json({ error: "操作種別が不正です。" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post[0]) {
      return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
    }

    try {
      const active = await togglePostReaction(postId, auth.session.userId, kind);
      const summary = await getPostReactionSummary(postId, auth.session.userId);
      return NextResponse.json({ active, ...summary });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("no such table")) {
        return NextResponse.json(
          { error: "いいね・お気に入り機能を使うには最新のデータベースマイグレーションを適用してください。" },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
