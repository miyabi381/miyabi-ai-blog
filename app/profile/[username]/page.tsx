import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { MarkdownContent } from "@/components/markdown-content";
import { ProfileAvatarForm } from "@/components/profile-avatar-form";
import {
  getFavoritePostsByUserId,
  getFollowState,
  getFollowingUsersByUserId,
  getLikedPostsByUserId,
  getPostsByUserId,
  getUserByUsername
} from "@/lib/data";
import { toJaDateTime } from "@/lib/format";
import { getSessionUser } from "@/lib/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Params = {
  params: { username: string };
};

export default async function ProfilePage({ params }: Params) {
  const [user, session] = await Promise.all([getUserByUsername(params.username), getSessionUser()]);
  if (!user) {
    notFound();
  }

  const [posts, likedPosts, favoritePosts, followingUsers, followState] = await Promise.all([
    getPostsByUserId(user.id),
    getLikedPostsByUserId(user.id),
    getFavoritePostsByUserId(user.id),
    getFollowingUsersByUserId(user.id),
    session ? getFollowState(session.userId, user.id) : Promise.resolve({ isFollowing: false, followingCount: 0 })
  ]);
  const canEditProfile = session?.userId === user.id;

  return (
    <section className="space-y-5">
      <article className="card p-6">
        <div className="flex items-center gap-4">
          <Avatar username={user.username} avatarUrl={user.avatarUrl} size={64} className="border border-slate-300" />
          <div>
            <h1 className="text-2xl font-bold">{user.displayName ?? user.username}</h1>
            <p className="mt-1 text-sm text-slate-600">@{user.username}</p>
            {canEditProfile ? <p className="mt-1 text-sm text-slate-600">{user.email}</p> : null}
            <p className="mt-1 text-xs text-slate-500">登録日: {toJaDateTime(user.createdAt)}</p>
            <p className="mt-1 text-xs text-slate-500">フォロー中: {followingUsers.length}</p>
          </div>
          {!canEditProfile ? (
            <FollowButton
              targetUserId={user.id}
              canFollow={Boolean(session)}
              initialIsFollowing={Boolean(followState.isFollowing)}
            />
          ) : null}
        </div>
        {canEditProfile ? (
          <ProfileAvatarForm initialDisplayName={user.displayName ?? user.username} initialAvatarUrl={user.avatarUrl} />
        ) : null}
      </article>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">投稿</h2>
        {posts.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">まだ投稿はありません。</p>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="block">
              <article className="card p-4 transition hover:border-slate-300 hover:shadow-md">
                <h3 className="font-semibold hover:text-accent">{post.title}</h3>
                <MarkdownContent markdown={post.content} className="markdown-preview mt-2 text-sm text-slate-700" />
                <p className="mt-1 text-xs text-slate-500">{toJaDateTime(post.createdAt)}</p>
              </article>
            </Link>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">フォロー中のアカウント</h2>
        {followingUsers.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">フォロー中のアカウントはありません。</p>
        ) : (
          followingUsers.map((followingUser) => (
            <article key={followingUser.id} className="card p-4">
              <Link href={`/profile/${followingUser.username}`} className="font-semibold hover:text-accent">
                {followingUser.displayName}
              </Link>
              <p className="mt-1 text-sm text-slate-600">@{followingUser.username}</p>
              <p className="mt-1 text-xs text-slate-500">フォロー開始: {toJaDateTime(followingUser.createdAt)}</p>
            </article>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">いいねした投稿</h2>
        {likedPosts.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">いいねした投稿はありません。</p>
        ) : (
          likedPosts.map((post) => (
            <article key={`liked-${post.id}`} className="card p-4">
              <Link href={`/posts/${post.id}`} className="font-semibold hover:text-accent">
                {post.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600">
                投稿者: {post.authorName} (@{post.authorUsername})
              </p>
              <p className="mt-1 text-xs text-slate-500">いいね日: {toJaDateTime(post.createdAt)}</p>
            </article>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">お気に入り投稿</h2>
        {favoritePosts.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">お気に入り投稿はありません。</p>
        ) : (
          favoritePosts.map((post) => (
            <article key={`favorite-${post.id}`} className="card p-4">
              <Link href={`/posts/${post.id}`} className="font-semibold hover:text-accent">
                {post.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600">
                投稿者: {post.authorName} (@{post.authorUsername})
              </p>
              <p className="mt-1 text-xs text-slate-500">登録日: {toJaDateTime(post.createdAt)}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

