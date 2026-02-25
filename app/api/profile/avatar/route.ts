import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { avatarSchema } from "@/lib/validators";

export const runtime = "edge";

function isMissingColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes("no such column") || message.includes("has no column named");
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const parsed = avatarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "画像URLが不正です。" }, { status: 400 });
    }

    const avatarUrl = parsed.data.avatarUrl.trim() || null;
    const db = await getDb();
    try {
      await db.update(users).set({ avatarUrl }).where(eq(users.id, auth.session.userId));
    } catch (error) {
      if (isMissingColumnError(error)) {
        return NextResponse.json(
          { error: "アイコン機能を使うには最新のデータベースマイグレーションを適用してください。" },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ avatarUrl });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
