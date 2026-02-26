import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { comments, postFavorites, postLikes, posts, userFollows, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { toDbTimestampJst } from "@/lib/format";

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

function isMissingSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("no such column") ||
    message.includes("has no column named") ||
    message.includes("no such table")
  );
}

function normalizeSearchQuery(query?: string) {
  const normalized = query?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function toLikePattern(query: string) {
  return `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

export async function getPostList(query?: string): Promise<PostListItem[]> {
  const db = await getDb();
  const searchQuery = normalizeSearchQuery(query);
  const likePattern = searchQuery ? toLikePattern(searchQuery) : null;
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
      .where(
        likePattern
          ? sql`(
              lower(${posts.title}) like ${likePattern} escape '\\'
              or lower(${posts.content}) like ${likePattern} escape '\\'
              or lower(coalesce(${users.displayName}, ${users.username})) like ${likePattern} escape '\\'
              or lower(${users.username}) like ${likePattern} escape '\\'
            )`
          : undefined
      )
      .orderBy(desc(posts.createdAt));
    return rows.map((row: (typeof rows)[number]) => ({
      ...row,
      authorName: row.authorName ?? row.authorUsername
    }));
  } catch (error) {
    if (!isMissingSchemaError(error)) {
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
      .where(
        likePattern
          ? sql`(
              lower(${posts.title}) like ${likePattern} escape '\\'
              or lower(${posts.content}) like ${likePattern} escape '\\'
              or lower(${users.username}) like ${likePattern} escape '\\'
            )`
          : undefined
      )
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
    if (!isMissingSchemaError(error)) {
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
    if (!isMissingSchemaError(error)) {
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
  const normalized = email.trim().toLowerCase();
  const result = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1);
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

export type ReactionSummary = {
  liked: boolean;
  favorited: boolean;
  likeCount: number;
  favoriteCount: number;
};

export async function getPostReactionSummary(postId: number, viewerUserId?: number | null): Promise<ReactionSummary> {
  const db = await getDb();
  try {
    const [likesRow, favoritesRow] = await Promise.all([
      db.select({ value: count() }).from(postLikes).where(eq(postLikes.postId, postId)),
      db.select({ value: count() }).from(postFavorites).where(eq(postFavorites.postId, postId))
    ]);

    if (!viewerUserId) {
      return {
        liked: false,
        favorited: false,
        likeCount: likesRow[0]?.value ?? 0,
        favoriteCount: favoritesRow[0]?.value ?? 0
      };
    }

    const [likedRow, favoritedRow] = await Promise.all([
      db
        .select({ id: postLikes.id })
        .from(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, viewerUserId)))
        .limit(1),
      db
        .select({ id: postFavorites.id })
        .from(postFavorites)
        .where(and(eq(postFavorites.postId, postId), eq(postFavorites.userId, viewerUserId)))
        .limit(1)
    ]);

    return {
      liked: likedRow.length > 0,
      favorited: favoritedRow.length > 0,
      likeCount: likesRow[0]?.value ?? 0,
      favoriteCount: favoritesRow[0]?.value ?? 0
    };
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error;
    }
    return { liked: false, favorited: false, likeCount: 0, favoriteCount: 0 };
  }
}

type PostReactionKind = "like" | "favorite";

export async function togglePostReaction(postId: number, userId: number, kind: PostReactionKind) {
  const db = await getDb();
  const table = kind === "like" ? postLikes : postFavorites;
  const exists = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.postId, postId), eq(table.userId, userId)))
    .limit(1);

  if (exists[0]) {
    await db.delete(table).where(eq(table.id, exists[0].id));
    return false;
  }

  await db.insert(table).values({ postId, userId, createdAt: toDbTimestampJst() });
  return true;
}

export async function getFollowState(followerUserId: number, targetUserId: number) {
  const db = await getDb();
  try {
    const [countRow, relation] = await Promise.all([
      db.select({ value: count() }).from(userFollows).where(eq(userFollows.followerUserId, followerUserId)),
      db
        .select({ id: userFollows.id })
        .from(userFollows)
        .where(and(eq(userFollows.followerUserId, followerUserId), eq(userFollows.followingUserId, targetUserId)))
        .limit(1)
    ]);
    return {
      followingCount: countRow[0]?.value ?? 0,
      isFollowing: relation.length > 0
    };
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error;
    }
    return { followingCount: 0, isFollowing: false };
  }
}

export async function toggleFollow(followerUserId: number, targetUserId: number) {
  const db = await getDb();
  const exists = await db
    .select({ id: userFollows.id })
    .from(userFollows)
    .where(and(eq(userFollows.followerUserId, followerUserId), eq(userFollows.followingUserId, targetUserId)))
    .limit(1);

  if (exists[0]) {
    await db.delete(userFollows).where(eq(userFollows.id, exists[0].id));
    return false;
  }

  await db
    .insert(userFollows)
    .values({ followerUserId, followingUserId: targetUserId, createdAt: toDbTimestampJst() });
  return true;
}

export type ProfilePostListItem = {
  id: number;
  title: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
};

export type FollowingUserItem = {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
};

export async function getFollowingUsersByUserId(userId: number): Promise<FollowingUserItem[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        createdAt: userFollows.createdAt
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingUserId, users.id))
      .where(eq(userFollows.followerUserId, userId))
      .orderBy(desc(userFollows.createdAt));
    return rows.map((row: (typeof rows)[number]) => ({
      ...row,
      displayName: row.displayName ?? row.username
    }));
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error;
    }
    return [];
  }
}

export async function getLikedPostsByUserId(userId: number): Promise<ProfilePostListItem[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        createdAt: postLikes.createdAt,
        authorName: users.displayName,
        authorUsername: users.username
      })
      .from(postLikes)
      .innerJoin(posts, eq(postLikes.postId, posts.id))
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(postLikes.userId, userId))
      .orderBy(desc(postLikes.createdAt));
    return rows.map((row: (typeof rows)[number]) => ({
      ...row,
      authorName: row.authorName ?? row.authorUsername
    }));
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error;
    }
    return [];
  }
}

export async function getFavoritePostsByUserId(userId: number): Promise<ProfilePostListItem[]> {
  const db = await getDb();
  try {
    const rows = await db
      .select({
        id: posts.id,
        title: posts.title,
        createdAt: postFavorites.createdAt,
        authorName: users.displayName,
        authorUsername: users.username
      })
      .from(postFavorites)
      .innerJoin(posts, eq(postFavorites.postId, posts.id))
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(postFavorites.userId, userId))
      .orderBy(desc(postFavorites.createdAt));
    return rows.map((row: (typeof rows)[number]) => ({
      ...row,
      authorName: row.authorName ?? row.authorUsername
    }));
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error;
    }
    return [];
  }
}
