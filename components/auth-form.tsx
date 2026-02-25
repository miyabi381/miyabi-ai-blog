"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const payload = mode === "login" ? { email, password } : { username, email, password };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "リクエストに失敗しました。");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      {mode === "register" && (
        <div className="space-y-1">
          <label className="text-sm font-medium">ユーザー名</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium">メールアドレス</label>
        <input
          type="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">パスワード</label>
        <input
          type="password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        disabled={loading}
        className="w-full rounded-lg bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "送信中..." : mode === "login" ? "ログイン" : "アカウント作成"}
      </button>
    </form>
  );
}
