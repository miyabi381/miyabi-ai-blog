"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";

type PostFormProps = {
  mode: "create" | "edit";
  postId?: number;
  initialTitle?: string;
  initialContent?: string;
};

export function PostForm({ mode, postId, initialTitle = "", initialContent = "" }: PostFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  function wrapSelection(before: string, after = "") {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const inserted = `${before}${selected}${after}`;
    const next = `${content.slice(0, start)}${inserted}${content.slice(end)}`;
    setContent(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + inserted.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  function insertPrefixForLines(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const replaced = selected
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    const next = `${content.slice(0, start)}${replaced}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replaced.length);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
      setError(data.error ?? "投稿を保存できませんでした。");
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
        <div className="flex flex-wrap gap-2 pb-2">
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => wrapSelection("## ")}>
            見出し
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => wrapSelection("**", "**")}>
            太字
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => wrapSelection("*", "*")}>
            斜体
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => wrapSelection("[リンクテキスト](", "https://example.com)")}
          >
            リンク
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => wrapSelection("`", "`")}>
            インラインコード
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => wrapSelection("\n```\n", "\n```\n")}
          >
            コードブロック
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => insertPrefixForLines("- ")}>
            箇条書き
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => insertPrefixForLines("> ")}>
            引用
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setPreview((current) => !current)}
          >
            {preview ? "プレビューを閉じる" : "プレビュー"}
          </button>
        </div>
        <textarea
          ref={textareaRef}
          rows={14}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={10}
        />
        {preview ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <MarkdownContent markdown={content} />
          </div>
        ) : null}
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
