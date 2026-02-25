import { asc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { comments, posts, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { commentSchema } from "@/lib/validators";

export const runtime = "edge";

function isMissingColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes("no such column") || message.includes("has no column named");
}

export async function GET(request: NextRequest) {
  const postId = Number(request.nextUrl.searchParams.get("postId"));
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "投稿IDが不正です。" }, { status: 400 });
  }

  const db = await getDb();
  let list: Array<{
    id: number;
    postId: number;
    userId: number;
    parentCommentId: number | null;
    content: string;
    createdAt: string;
    authorName: string;
    authorAvatarUrl: string | null;
  }> = [];
  try {
    list = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        parentCommentId: comments.parentCommentId,
        content: comments.content,
        createdAt: comments.createdAt,
        authorName: users.username,
        authorAvatarUrl: users.avatarUrl
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
    const legacy = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        authorName: users.username
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
    list = legacy.map((comment: Omit<(typeof list)[number], "parentCommentId" | "authorAvatarUrl">) => ({
      ...comment,
      parentCommentId: null,
      authorAvatarUrl: null
    }));
  }

  return NextResponse.json({ comments: list });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as { postId?: unknown; parentCommentId?: unknown; content?: unknown };
    const parsed = commentSchema.safeParse({
      postId: Number(body?.postId),
      parentCommentId:
        body?.parentCommentId === null || body?.parentCommentId === undefined
          ? null
          : Number(body.parentCommentId),
      content: typeof body?.content === "string" ? body.content : body?.content
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容が不正です。" }, { status: 400 });
    }

    const db = await getDb();
    const post = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, parsed.data.postId)).limit(1);
    if (post.length === 0) {
      return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
    }

    if (parsed.data.parentCommentId) {
      const parent = await db
        .select({ id: comments.id, postId: comments.postId })
        .from(comments)
        .where(eq(comments.id, parsed.data.parentCommentId))
        .limit(1);
      if (!parent[0] || parent[0].postId !== parsed.data.postId) {
        return NextResponse.json({ error: "返信先コメントが見つかりません。" }, { status: 404 });
      }
    }

    let inserted: Array<{
      id: number;
      postId: number;
      userId: number;
      parentCommentId: number | null;
      content: string;
      createdAt: string;
    }>;
    try {
      inserted = await db
        .insert(comments)
        .values({
          postId: parsed.data.postId,
          userId: auth.session.userId,
          parentCommentId: parsed.data.parentCommentId ?? null,
          content: parsed.data.content
        })
        .returning({
          id: comments.id,
          postId: comments.postId,
          userId: comments.userId,
          parentCommentId: comments.parentCommentId,
          content: comments.content,
          createdAt: comments.createdAt
        });
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }
      if (parsed.data.parentCommentId) {
        return NextResponse.json(
          { error: "返信機能を有効化するには最新のデータベースマイグレーションを適用してください。" },
          { status: 503 }
        );
      }
      const legacyInserted = await db
        .insert(comments)
        .values({
          postId: parsed.data.postId,
          userId: auth.session.userId,
          content: parsed.data.content
        })
        .returning({
          id: comments.id,
          postId: comments.postId,
          userId: comments.userId,
          content: comments.content,
          createdAt: comments.createdAt
        });
      inserted = legacyInserted.map((comment: Omit<(typeof inserted)[number], "parentCommentId">) => ({
        ...comment,
        parentCommentId: null
      }));
    }

    return NextResponse.json({ comment: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
