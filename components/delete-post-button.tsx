"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeletePostButtonProps = {
  postId: number;
};

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm("この記事を削除しますか？")) {
      return;
    }
    setLoading(true);
    const response = await fetch(`/api/posts?postId=${postId}`, { method: "DELETE" });
    setLoading(false);
    if (response.ok) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="rounded-lg bg-rose-600 px-4 py-2 text-white disabled:opacity-60"
    >
      {loading ? "削除中..." : "削除"}
    </button>
  );
}
