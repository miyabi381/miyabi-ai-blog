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
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [textColor, setTextColor] = useState("red");
  const colorSwatch: Record<string, string> = {
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    orange: "#ea580c",
    purple: "#9333ea",
    pink: "#db2777",
    teal: "#0d9488",
    gray: "#4b5563"
  };
  const blockTemplates: Array<{ label: string; text: string }> = [
    { label: "セクション", text: "\n## セクションタイトル\n\n本文を入力\n" },
    { label: "小見出し", text: "\n### 小見出し\n\n本文を入力\n" },
    { label: "仕切り線", text: "\n---\n" },
    { label: "画像ブロック", text: "\n![画像説明](https://example.com/image.png)\n" },
    { label: "引用ブロック", text: "\n> 引用文\n" },
    { label: "チェックリスト", text: "\n- [ ] タスク1\n- [ ] タスク2\n" },
    { label: "コードブロック", text: "\n```ts\n\n```\n" },
    { label: "リンクブロック", text: "\n[リンクテキスト](https://example.com)\n" }
  ];

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

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => `${prev}${text}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${content.slice(0, start)}${text}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + text.length;
      textarea.setSelectionRange(caret, caret);
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
          <button type="button" className="rounded border px-2 py-1 text-xs font-bold" title="太字" onClick={() => wrapSelection("**", "**")}>
            B
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs italic" title="斜体" onClick={() => wrapSelection("*", "*")}>
            I
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs underline" title="下線" onClick={() => wrapSelection("__", "__")}>
            U
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="見出し" onClick={() => wrapSelection("## ")}>
            H2
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            title="文字色"
            onClick={() => wrapSelection(`[color:${textColor}]`, "[/color]")}
          >
            <span style={{ color: colorSwatch[textColor] ?? "#111827" }}>A</span>
          </button>
          <select
            className="rounded border px-2 py-1 text-xs"
            value={textColor}
            onChange={(event) => setTextColor(event.target.value)}
            title="色を選択"
          >
            <option value="red">赤</option>
            <option value="blue">青</option>
            <option value="green">緑</option>
            <option value="orange">オレンジ</option>
            <option value="purple">紫</option>
            <option value="pink">ピンク</option>
            <option value="teal">ティール</option>
            <option value="gray">グレー</option>
          </select>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="リンク" onClick={() => wrapSelection("[リンクテキスト](", "https://example.com)")}>
            Link
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="画像URL" onClick={() => wrapSelection("![画像説明](", "https://example.com/image.png)")}>
            Img
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="水平線" onClick={() => insertAtCursor("\n---\n")}>
            HR
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="インラインコード" onClick={() => wrapSelection("`", "`")}>
            {"</>"}
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="JavaScriptコードブロック" onClick={() => insertAtCursor("\n```js\n\n```\n")}>
            JS
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="HTMLコードブロック" onClick={() => insertAtCursor("\n```html\n\n```\n")}>
            HTML
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="CSSコードブロック" onClick={() => insertAtCursor("\n```css\n\n```\n")}>
            CSS
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="箇条書き" onClick={() => insertPrefixForLines("- ")}>
            List
          </button>
          <button type="button" className="rounded border px-2 py-1 text-xs" title="引用" onClick={() => insertPrefixForLines("> ")}>
            Quote
          </button>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-slate-500">表示モード</span>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`rounded border px-2 py-1 text-xs ${viewMode === "split" ? "bg-slate-800 text-white" : ""}`}
          >
            分割
          </button>
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`rounded border px-2 py-1 text-xs ${viewMode === "edit" ? "bg-slate-800 text-white" : ""}`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`rounded border px-2 py-1 text-xs ${viewMode === "preview" ? "bg-slate-800 text-white" : ""}`}
          >
            プレビュー
          </button>
        </div>

        <div className="mb-2 flex flex-wrap gap-2">
          <span className="w-full text-xs font-semibold tracking-wide text-slate-500">ブロック挿入</span>
          {blockTemplates.map((template) => (
            <button
              key={template.label}
              type="button"
              className="rounded border border-slate-300 px-2 py-1 text-xs"
              onClick={() => insertAtCursor(template.text)}
            >
              {template.label}
            </button>
          ))}
        </div>

        <div className={`grid gap-3 ${viewMode === "split" ? "md:grid-cols-2" : ""}`}>
          {(viewMode === "split" || viewMode === "edit") && (
            <label className="space-y-1">
              <span className="text-xs font-semibold tracking-wide text-slate-500">エディタ</span>
              <textarea
                ref={textareaRef}
                rows={14}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                minLength={10}
              />
            </label>
          )}

          {(viewMode === "split" || viewMode === "preview") && (
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500">ライブプレビュー</p>
              <MarkdownContent markdown={content || " "} />
            </div>
          )}
        </div>
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
