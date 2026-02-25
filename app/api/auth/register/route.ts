import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { issueAuthCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getUserByEmail, getUserByUsername } from "@/lib/data";
import { registerSchema } from "@/lib/validators";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容が不正です。" }, { status: 400 });
    }

    const { username, email, password } = parsed.data;
    const [existingEmail, existingUsername] = await Promise.all([
      getUserByEmail(email),
      getUserByUsername(username)
    ]);
    if (existingEmail || existingUsername) {
      return NextResponse.json({ error: "このユーザー名またはメールアドレスは既に使われています。" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await getDb();
    await db.insert(users).values({ username, displayName: username, email, hashedPassword });

    const created = await getUserByEmail(email);
    if (!created) {
      return NextResponse.json({ error: "ユーザーを作成できませんでした。" }, { status: 500 });
    }

    await issueAuthCookie({ userId: created.id, username: created.username, email: created.email });

    return NextResponse.json({
      user: { id: created.id, username: created.username, email: created.email }
    });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}

