import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { comments, posts, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { commentSchema } from "@/lib/validators";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const postId = Number(request.nextUrl.searchParams.get("postId"));
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "投稿IDが不正です。" }, { status: 400 });
  }

  const db = await getDb();
  const list = await db
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
    .orderBy(desc(comments.createdAt));

  return NextResponse.json({ comments: list });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as { postId?: unknown; content?: unknown };
    const parsed = commentSchema.safeParse({
      postId: Number(body?.postId),
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

    const inserted = await db
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

    return NextResponse.json({ comment: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
