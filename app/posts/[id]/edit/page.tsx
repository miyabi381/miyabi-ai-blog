import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { getPostById } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type Params = {
  params: { id: string };
};

export default async function EditPostPage({ params }: Params) {
  const postId = Number(params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  const [post, user] = await Promise.all([getPostById(postId), getSessionUser()]);
  if (!post) {
    notFound();
  }
  if (!user) {
    redirect("/login");
  }
  if (post.userId !== user.userId) {
    redirect(`/posts/${post.id}`);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
      <PostForm mode="edit" postId={post.id} initialTitle={post.title} initialContent={post.content} />
    </section>
  );
}

