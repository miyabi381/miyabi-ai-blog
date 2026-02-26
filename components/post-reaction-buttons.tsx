"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PostReactionButtonsProps = {
  postId: number;
  canReact: boolean;
  initialLiked: boolean;
  initialFavorited: boolean;
  initialLikeCount: number;
  initialFavoriteCount: number;
};

export function PostReactionButtons({
  postId,
  canReact,
  initialLiked,
  initialFavorited,
  initialLikeCount,
  initialFavoriteCount
}: PostReactionButtonsProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [favoriteCount, setFavoriteCount] = useState(initialFavoriteCount);
  const [loadingKind, setLoadingKind] = useState<"like" | "favorite" | null>(null);
  const [error, setError] = useState("");

  async function toggle(kind: "like" | "favorite") {
    if (!canReact || loadingKind) {
      if (!canReact) {
        router.push("/login");
      }
      return;
    }

    setError("");
    setLoadingKind(kind);
    const response = await fetch("/api/posts/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, kind })
    });
    const data = (await response.json()) as {
      error?: string;
      liked?: boolean;
      favorited?: boolean;
      likeCount?: number;
      favoriteCount?: number;
    };
    setLoadingKind(null);

    if (!response.ok) {
      setError(data.error ?? "更新できませんでした。");
      return;
    }

    setLiked(Boolean(data.liked));
    setFavorited(Boolean(data.favorited));
    setLikeCount(data.likeCount ?? 0);
    setFavoriteCount(data.favoriteCount ?? 0);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={loadingKind !== null}
          onClick={() => toggle("like")}
          className={`rounded-full border px-3 py-1 text-sm ${liked ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 bg-white text-slate-700"} disabled:opacity-60`}
        >
          いいね {likeCount}
        </button>
        <button
          type="button"
          disabled={loadingKind !== null}
          onClick={() => toggle("favorite")}
          className={`rounded-full border px-3 py-1 text-sm ${favorited ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-300 bg-white text-slate-700"} disabled:opacity-60`}
        >
          お気に入り {favoriteCount}
        </button>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
