import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentForm } from "@/components/comment-form";
import { DeletePostButton } from "@/components/delete-post-button";
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
          <Link href={`/profile/${post.authorName}`} className="font-medium hover:text-accent">
            @{post.authorName}
          </Link>
          <span>{toJaDateTime(post.createdAt)}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-800">{post.content}</p>
      </article>

      {canEdit ? (
        <div className="flex items-center gap-3">
          <Link href={`/posts/${post.id}/edit`} className="rounded-lg bg-ink px-4 py-2 text-white">
            Edit
          </Link>
          <DeletePostButton postId={post.id} />
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Comments</h2>
        {comments.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="card p-4">
              <div className="mb-1 flex items-center gap-3 text-xs text-slate-500">
                <Link href={`/profile/${comment.authorName}`} className="font-medium hover:text-accent">
                  @{comment.authorName}
                </Link>
                <span>{toJaDateTime(comment.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-800">{comment.content}</p>
            </article>
          ))
        )}
      </section>

      {session ? (
        <CommentForm postId={post.id} />
      ) : (
        <p className="text-sm text-slate-600">
          To post a comment, please{" "}
          <Link href="/login" className="font-semibold text-accent">
            login
          </Link>
          .
        </p>
      )}
    </section>
  );
}
