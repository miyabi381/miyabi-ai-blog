import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { MarkdownContent } from "@/components/markdown-content";
import { getPostList } from "@/lib/data";
import { toJaDateTime } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: { q?: string | string[] };
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawQuery = searchParams?.q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";
  const posts = await getPostList(query);

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">ブログプラットフォーム</p>
        <h1 className="text-2xl font-bold tracking-tight">最新の投稿</h1>
        <form action="/" method="get" className="pt-2">
          <label htmlFor="post-search" className="sr-only">
            投稿検索
          </label>
          <div className="flex gap-2">
            <input
              id="post-search"
              name="q"
              defaultValue={query}
              placeholder="タイトル・本文・ユーザー名で検索"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">検索</button>
          </div>
        </form>
      </div>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="card p-6 text-slate-600">{query ? "該当する投稿はありません。" : "まだ投稿はありません。"}</p>
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
