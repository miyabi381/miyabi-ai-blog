import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CommentForm } from "@/components/comment-form";
import { CommentThread } from "@/components/comment-thread";
import { DeletePostButton } from "@/components/delete-post-button";
import { MarkdownContent } from "@/components/markdown-content";
import { getCommentsByPostId, getPostById } from "@/lib/data";
import { toJaDateTime } from "@/lib/format";
import { getSessionUser } from "@/lib/session";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Params = {
  params: { id: string };
};

export default async function PostDetailPage({ params }: Params) {
  const postId = Number(params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  const [post, comments, session] = await Promise.all([
    getPostById(postId),
    getCommentsByPostId(postId),
    getSessionUser()
  ]);

  if (!post) {
    notFound();
  }

  const canEdit = session?.userId === post.userId;

  return (
    <section className="space-y-6">
      <article className="card p-6">
        <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
          <Avatar username={post.authorName} avatarUrl={post.authorAvatarUrl} size={32} />
          <Link href={`/profile/${post.authorName}`} className="font-medium hover:text-accent">
            @{post.authorName}
          </Link>
          <span>{toJaDateTime(post.createdAt)}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <MarkdownContent markdown={post.content} className="mt-5 leading-7 text-slate-800" />
      </article>

      {canEdit ? (
        <div className="flex items-center gap-3">
          <Link href={`/posts/${post.id}/edit`} className="rounded-lg bg-ink px-4 py-2 text-white">
            編集
          </Link>
          <DeletePostButton postId={post.id} />
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">コメント</h2>
        <CommentThread postId={post.id} comments={comments} canReply={Boolean(session)} />
      </section>

      {session ? (
        <CommentForm postId={post.id} />
      ) : (
        <p className="text-sm text-slate-600">
          コメントするには{" "}
          <Link href="/login" className="font-semibold text-accent">
            ログイン
          </Link>
          してください。
        </p>
      )}
    </section>
  );
}
