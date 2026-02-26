"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FollowButtonProps = {
  targetUserId: number;
  canFollow: boolean;
  initialIsFollowing: boolean;
};

export function FollowButton({ targetUserId, canFollow, initialIsFollowing }: FollowButtonProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onToggle() {
    if (!canFollow || loading) {
      if (!canFollow) {
        router.push("/login");
      }
      return;
    }

    setError("");
    setLoading(true);
    const response = await fetch("/api/users/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId })
    });
    const data = (await response.json()) as { error?: string; isFollowing?: boolean };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "フォロー状態を更新できませんでした。");
      return;
    }

    setIsFollowing(Boolean(data.isFollowing));
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        className={`rounded-full px-3 py-1.5 text-sm ${isFollowing ? "bg-slate-200 text-slate-700" : "bg-ink text-white"} disabled:opacity-60`}
      >
        {isFollowing ? "フォロー中" : "フォロー"}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
