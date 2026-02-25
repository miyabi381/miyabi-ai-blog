import Link from "next/link";
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
            <article key={post.id} className="card p-6">
              <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
                <span>@{post.authorName}</span>
                <span>{toJaDateTime(post.createdAt)}</span>
              </div>
              <h2 className="text-xl font-semibold">
                <Link href={`/posts/${post.id}`} className="hover:text-accent">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {post.content}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
