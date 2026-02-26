"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { RichMarkdownEditor } from "@/components/rich-markdown-editor";

type PostFormProps = {
  mode: "create" | "edit";
  postId?: number;
  initialTitle?: string;
  initialContent?: string;
};

export function PostForm({ mode, postId, initialTitle = "", initialContent = "" }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [contentError, setContentError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContentError("");
    setError("");
    if (content.trim().length === 0) {
      setContentError("本文を入力してください。");
      return;
    }
    setLoading(true);

    const url = mode === "create" ? "/api/posts" : `/api/posts?postId=${postId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    const data = (await response.json()) as { error?: string; post?: { id: number } };
    setLoading(false);

    if (!response.ok) {
      if (data.error?.includes("本文")) {
        setContentError(data.error);
      } else {
        setError(data.error ?? "投稿を保存できませんでした。");
      }
      return;
    }

    if (mode === "create") {
      if (!data.post?.id) {
        setError("作成した投稿を取得できませんでした。");
        return;
      }
      router.push(`/posts/${data.post.id}`);
    } else {
      router.push(`/posts/${postId}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium">タイトル</label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">本文</label>
        <RichMarkdownEditor initialMarkdown={initialContent} onChangeMarkdown={setContent} />
        <p className={`min-h-5 text-sm ${contentError ? "text-rose-600" : "text-transparent"}`}>
          {contentError || " "}
        </p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        disabled={loading}
        className="rounded-lg bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "保存中..." : mode === "create" ? "公開する" : "更新する"}
      </button>
    </form>
  );
}
