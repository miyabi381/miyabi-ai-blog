import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { issueAuthCookie } from "@/lib/auth";
import { getUserByEmail } from "@/lib/data";
import { loginSchema } from "@/lib/validators";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容が不正です。" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません。" }, { status: 401 });
    }

    const matched = await bcrypt.compare(password, user.hashedPassword);
    if (!matched) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません。" }, { status: 401 });
    }

    await issueAuthCookie({ userId: user.id, username: user.username, email: user.email });

    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch {
    return NextResponse.json({ error: "予期しないエラーが発生しました。" }, { status: 500 });
  }
}

