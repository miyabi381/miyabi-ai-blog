"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileAvatarFormProps = {
  initialDisplayName: string;
  initialAvatarUrl: string | null;
};

export function ProfileAvatarForm({ initialDisplayName, initialAvatarUrl }: ProfileAvatarFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const response = await fetch("/api/profile/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, avatarUrl })
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "プロフィール設定を更新できませんでした。");
      return;
    }

    setSuccess("プロフィール設定を更新しました。");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card mt-4 space-y-3 p-4">
      <label className="text-sm font-medium">表示名</label>
      <input
        type="text"
        maxLength={40}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        required
      />
      <label className="text-sm font-medium">アイコン画像URL</label>
      <input
        type="url"
        placeholder="https://example.com/avatar.png"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
        value={avatarUrl}
        onChange={(event) => setAvatarUrl(event.target.value)}
      />
      <p className="text-xs text-slate-500">http:// または https:// で始まるURLを指定。空欄で初期アイコンに戻せます。</p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <button
        disabled={loading}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "更新中..." : "プロフィールを保存"}
      </button>
    </form>
  );
}
