import { redirect } from "next/navigation";
import { PostForm } from "@/components/post-form";
import { getSessionUser } from "@/lib/session";

export const runtime = "edge";

export default async function NewPostPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">新規投稿</h1>
      <PostForm mode="create" />
    </section>
  );
}

