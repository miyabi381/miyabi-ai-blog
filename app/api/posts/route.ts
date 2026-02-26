import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { posts } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { getPostById, getPostList } from "@/lib/data";
import { toDbTimestampJst } from "@/lib/format";
import { ensureSameOriginRequest } from "@/lib/security";
import { postSchema } from "@/lib/validators";

export const runtime = "edge";

function parsePostId(value: string | null) {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function postValidationMessage(error: z.ZodError<{ title: string; content: string }>) {
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "title") {
      return "タイトルは3文字以上120文字以内で入力してください。";
    }
    if (field === "content") {
      return "本文は10文字以上で入力してください。";
    }
  }
  return "入力内容が不正です。";
}

export async function GET(request: NextRequest) {
  const postId = parsePostId(request.nextUrl.searchParams.get("postId"));
  if (!postId) {
    const query = request.nextUrl.searchParams.get("q") ?? undefined;
    const list = await getPostList(query);
    return NextResponse.json({ posts: list });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function POST(request: NextRequest) {
  const csrfError = ensureSameOriginRequest(request);
  if (csrfError) {
    return csrfError;
  }

  try {
    const auth = await requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: postValidationMessage(parsed.error) }, { status: 400 });
    }

    const db = await getDb();
    const inserted = await db
      .insert(posts)
      .values({
        userId: auth.session.userId,
        title: parsed.data.title,
        content: parsed.data.content,
        createdAt: toDbTimestampJst()
      })
      .returning({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt
      });

    const post = inserted[0];
    if (!post) {
      return NextResponse.json({ error: "投稿を作成できませんでした。" }, { status: 500 });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const csrfError = ensureSameOriginRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const postId = parsePostId(request.nextUrl.searchParams.get("postId"));
  if (!postId) {
    return NextResponse.json({ error: "投稿IDが不正です。" }, { status: 400 });
  }

  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: postValidationMessage(parsed.error) }, { status: 400 });
    }

    const current = await getPostById(postId);
    if (!current) {
      return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
    }
    if (current.userId !== auth.session.userId) {
      return NextResponse.json({ error: "この操作を行う権限がありません。" }, { status: 403 });
    }

    const db = await getDb();
    await db.update(posts).set({ title: parsed.data.title, content: parsed.data.content }).where(eq(posts.id, postId));

    const post = await getPostById(postId);
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrfError = ensureSameOriginRequest(request);
  if (csrfError) {
    return csrfError;
  }

  const postId = parsePostId(request.nextUrl.searchParams.get("postId"));
  if (!postId) {
    return NextResponse.json({ error: "投稿IDが不正です。" }, { status: 400 });
  }

  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const current = await getPostById(postId);
    if (!current) {
      return NextResponse.json({ error: "投稿が見つかりません。" }, { status: 404 });
    }
    if (current.userId !== auth.session.userId) {
      return NextResponse.json({ error: "この操作を行う権限がありません。" }, { status: 403 });
    }

    const db = await getDb();
    await db.delete(posts).where(eq(posts.id, postId));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
