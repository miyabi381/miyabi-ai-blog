import { NextResponse, type NextRequest } from "next/server";
import { posts } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { getPostList } from "@/lib/data";
import { postSchema } from "@/lib/validators";

export const runtime = "edge";

export async function GET() {
  const list = await getPostList();
  return NextResponse.json({ posts: list });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const db = getDb();
    const inserted = await db
      .insert(posts)
      .values({
        userId: auth.session.userId,
        title: parsed.data.title,
        content: parsed.data.content
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
      return NextResponse.json({ error: "Could not create post." }, { status: 500 });
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
