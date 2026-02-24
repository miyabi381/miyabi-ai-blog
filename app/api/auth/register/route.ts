import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { issueAuthCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getUserByEmail, getUserByUsername } from "@/lib/data";
import { registerSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const { username, email, password } = parsed.data;
    const [existingEmail, existingUsername] = await Promise.all([
      getUserByEmail(email),
      getUserByUsername(username)
    ]);
    if (existingEmail || existingUsername) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = getDb();
    await db.insert(users).values({ username, email, hashedPassword });

    const created = await getUserByEmail(email);
    if (!created) {
      return NextResponse.json({ error: "Could not create user." }, { status: 500 });
    }

    await issueAuthCookie({ userId: created.id, username: created.username, email: created.email });

    return NextResponse.json({
      user: { id: created.id, username: created.username, email: created.email }
    });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

