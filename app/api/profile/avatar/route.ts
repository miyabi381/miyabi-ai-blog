import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-middleware";
import { getDb } from "@/lib/db";
import { avatarSchema } from "@/lib/validators";

export const runtime = "edge";

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
    await db.update(users).set({ avatarUrl }).where(eq(users.id, auth.session.userId));

    return NextResponse.json({ avatarUrl });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}
