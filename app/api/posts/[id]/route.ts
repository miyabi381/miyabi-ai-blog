import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { posts } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { getPostById } from "@/lib/data";
import { postSchema } from "@/lib/validators";

export const runtime = "edge";

function parsePostId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const postId = parsePostId(params.id);
  if (!postId) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const post = await getPostById(postId);
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const postId = parsePostId(params.id);
  if (!postId) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const current = await getPostById(postId);
    if (!current) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (current.userId !== auth.session.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const db = getDb();
    await db.update(posts).set({ title: parsed.data.title, content: parsed.data.content }).where(eq(posts.id, postId));

    const post = await getPostById(postId);
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const postId = parsePostId(params.id);
  if (!postId) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const current = await getPostById(postId);
    if (!current) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (current.userId !== auth.session.userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const db = getDb();
    await db.delete(posts).where(eq(posts.id, postId));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
