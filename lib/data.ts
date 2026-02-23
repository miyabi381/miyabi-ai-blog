import { and, desc, eq } from "drizzle-orm";
import { comments, posts, users } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function getPostList() {
  const db = getDb();
  return db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      authorName: users.username
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt));
}

export async function getPostById(postId: number) {
  const db = getDb();
  const result = await db
    .select({
      id: posts.id,
      userId: posts.userId,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      authorName: users.username
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, postId))
    .limit(1);
  return result[0] ?? null;
}

export async function getCommentsByPostId(postId: number) {
  const db = getDb();
  return db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      authorName: users.username
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function getUserByUsername(username: string) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(userId: number) {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function getPostsByUserId(userId: number) {
  const db = getDb();
  return db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
}

export async function canEditPost(postId: number, userId: number) {
  const db = getDb();
  const result = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1);
  return result.length > 0;
}

