import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { users } from "@/db/schema";
import { issueAuthCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getUserByEmail, getUserByUsername } from "@/lib/data";
import { toDbTimestampJst } from "@/lib/format";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ensureSameOriginRequest, normalizeEmail, normalizeUsername } from "@/lib/security";
import { registerSchema } from "@/lib/validators";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "auth_register", 10, 10 * 60 * 1000);
  if (limited) {
    return limited;
  }

  const csrfError = ensureSameOriginRequest(request);
  if (csrfError) {
    return csrfError;
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容が不正です。" }, { status: 400 });
    }

    const username = normalizeUsername(parsed.data.username);
    const email = normalizeEmail(parsed.data.email);
    const { password } = parsed.data;
    const [existingEmail, existingUsername] = await Promise.all([
      getUserByEmail(email),
      getUserByUsername(username)
    ]);
    if (existingEmail || existingUsername) {
      return NextResponse.json({ error: "登録に失敗しました。入力内容を確認してください。" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await getDb();
    await db.insert(users).values({
      username,
      displayName: username,
      email,
      hashedPassword,
      createdAt: toDbTimestampJst()
    });

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

