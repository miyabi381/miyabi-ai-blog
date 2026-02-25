"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CommentFormProps = {
  postId: number;
};

export function CommentForm({ postId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content })
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "コメントを投稿できませんでした。");
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card mt-6 space-y-3 p-4">
      <label className="text-sm font-medium">コメントを追加</label>
      <textarea
        rows={4}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        disabled={loading}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "投稿中..." : "コメントを投稿"}
      </button>
    </form>
  );
}
