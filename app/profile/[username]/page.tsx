import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByUserId, getUserByUsername } from "@/lib/data";
import { toJaDateTime } from "@/lib/format";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Params = {
  params: { username: string };
};

export default async function ProfilePage({ params }: Params) {
  const user = await getUserByUsername(params.username);
  if (!user) {
    notFound();
  }

  const posts = await getPostsByUserId(user.id);

  return (
    <section className="space-y-5">
      <article className="card p-6">
        <h1 className="text-2xl font-bold">@{user.username}</h1>
        <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        <p className="mt-1 text-xs text-slate-500">登録日: {toJaDateTime(user.createdAt)}</p>
      </article>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">投稿</h2>
        {posts.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">まだ投稿はありません。</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="card p-4">
              <Link href={`/posts/${post.id}`} className="font-semibold hover:text-accent">
                {post.title}
              </Link>
              <p className="mt-1 text-xs text-slate-500">{toJaDateTime(post.createdAt)}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

