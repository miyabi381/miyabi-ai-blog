import Link from "next/link";
import { getSessionUser } from "@/lib/session";

export async function Navbar() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="page-shell flex items-center justify-between py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-ink">
          Miyabi Blog
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-700 hover:text-ink">
            投稿一覧
          </Link>
          {user ? (
            <>
              <Link href="/editor/new" className="text-slate-700 hover:text-ink">
                新規投稿
              </Link>
              <Link href={`/profile/${user.username}`} className="text-slate-700 hover:text-ink">
                {user.username}
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="rounded-full bg-ink px-3 py-1.5 text-white">ログアウト</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-700 hover:text-ink">
                ログイン
              </Link>
              <Link href="/register" className="rounded-full bg-ink px-3 py-1.5 text-white">
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
