import { and, asc, desc, eq } from "drizzle-orm";
import { comments, posts, users } from "@/db/schema";
import { getDb } from "@/lib/db";

export type PostListItem = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
};

export type PostDetail = {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
};

function isMissingColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes("no such column") || message.includes("has no column named");
}

export async function getPostList(): Promise<PostListItem[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        authorName: users.displayName,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));
    return rows.map((row: (typeof rows)[number]) => ({
      ...row,
      authorName: row.authorName ?? row.authorUsername
    }));
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
    const legacy = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        authorUsername: users.username
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));
    return legacy.map((post: (typeof legacy)[number]) => ({
      ...post,
      authorName: post.authorUsername,
      authorAvatarUrl: null
    }));
  }
}

export async function getPostById(postId: number): Promise<PostDetail | null> {
  const db = await getDb();
  try {
    const result = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        authorName: users.displayName,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);
    const row = result[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      authorName: row.authorName ?? row.authorUsername
    };
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
    const legacy = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        title: posts.title,
        content: posts.content,
        createdAt: posts.createdAt,
        authorUsername: users.username
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);
    const post = legacy[0];
    return post
      ? { ...post, authorName: post.authorUsername, authorAvatarUrl: null }
      : null;
  }
}

export type CommentItem = {
  id: number;
  postId: number;
  content: string;
  createdAt: string;
  userId: number;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  parentCommentId: number | null;
};

export async function getCommentsByPostId(postId: number): Promise<CommentItem[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        content: comments.content,
        createdAt: comments.createdAt,
        userId: comments.userId,
        authorName: users.displayName,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl,
        parentCommentId: comments.parentCommentId
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
    return rows.map((row: (typeof rows)[number]) => ({
      ...row,
      authorName: row.authorName ?? row.authorUsername
    }));
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
    const legacy = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        content: comments.content,
        createdAt: comments.createdAt,
        userId: comments.userId,
        authorUsername: users.username
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
    return legacy.map((comment: (typeof legacy)[number]) => ({
      ...comment,
      authorName: comment.authorUsername,
      authorAvatarUrl: null,
      parentCommentId: null
    }));
  }
}

export async function getUserByEmail(email: string): Promise<(typeof users.$inferSelect) | null> {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function getUserByUsername(username: string): Promise<(typeof users.$inferSelect) | null> {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(userId: number): Promise<(typeof users.$inferSelect) | null> {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? null;
}

export async function getPostsByUserId(userId: number): Promise<(typeof posts.$inferSelect)[]> {
  const db = await getDb();
  return db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
}

export async function canEditPost(postId: number, userId: number) {
  const db = await getDb();
  const result = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1);
  return result.length > 0;
}
