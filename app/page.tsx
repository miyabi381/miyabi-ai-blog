import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { getPostList } from "@/lib/data";
import { toJaDateTime } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPostList();

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">ブログプラットフォーム</p>
        <h1 className="text-2xl font-bold tracking-tight">最新の投稿</h1>
      </div>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="card p-6 text-slate-600">まだ投稿はありません。</p>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="block">
              <article className="card p-6 transition hover:border-slate-300 hover:shadow-md">
                <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
                  <Avatar username={post.authorUsername} avatarUrl={post.authorAvatarUrl} size={24} />
                  <span>{post.authorName}</span>
                  <span className="text-slate-400">@{post.authorUsername}</span>
                  <span>{toJaDateTime(post.createdAt)}</span>
                </div>
                <h2 className="text-xl font-semibold hover:text-accent">{post.title}</h2>
                <MarkdownContent markdown={post.content} className="markdown-preview mt-2 text-sm text-slate-700" />
              </article>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
