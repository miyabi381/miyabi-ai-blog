# miyabi-ai-blog

このリポジトリは、すべてAIによって生成されたコードで構成されています。

Cloudflare Pages + D1 で動作する、Qiita 風のブログプラットフォームです。  
Next.js 14 App Router / TypeScript / TailwindCSS / Drizzle ORM / JWT 認証を使用しています。

## Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Cloudflare Pages
- Cloudflare D1
- Drizzle ORM
- JWT + HTTP Only Cookie
- bcryptjs

## Features

- 認証
- ユーザー登録 / ログイン / ログアウト
- JWT を HTTP Only Cookie に保存
- 認証ミドルウェア（`lib/auth-middleware.ts`）
- 記事
- 作成 / 編集 / 削除 / 一覧 / 詳細
- 新着順取得
- 投稿日時表示（日本形式）
- コメント
- 投稿 / 一覧表示
- ログインユーザーのみ投稿可能
- プロフィール
- ユーザー情報表示
- ユーザー投稿一覧

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/:id`
- `PATCH /api/posts/:id`
- `DELETE /api/posts/:id`
- `GET /api/comments?postId=`
- `POST /api/comments`

## Local Setup

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を設定（ローカル）

```bash
cp .env.example .env.local
```

`JWT_SECRET` を強い文字列に変更してください。

3. Cloudflare Pages プロジェクト設定で D1 バインディングを追加

   - Binding name: `DB`
   - Database: `miyabi_blog`

4. マイグレーション適用（ローカル D1）

```bash
npm run db:migrate:local
```

5. 開発起動

```bash
npm run dev
```

## Cloudflare Pages Build / Dev

1. ビルド

```bash
npm run build
```

2. Pages ローカル実行

```bash
npm run wrangler:dev
```

`wrangler pages dev .vercel/output/static` で Pages Functions 付きで実行されます。

## Notes

- `wrangler.toml` で `migrations_dir = "drizzle"` を指定しています。
- `postinstall` で `scripts/patch-cloudflare-tooling.js` が実行され、
  Windows 環境での `@cloudflare/next-on-pages` / `wrangler` 実行互換性を補正します。

## D1 Schema

- `users`
- `id`, `username`, `email`, `hashed_password`, `created_at`
- `posts`
- `id`, `user_id`, `title`, `content`, `created_at`
- `comments`
- `id`, `post_id`, `user_id`, `content`, `created_at`

## Important Files

- `db/schema.ts`
- `drizzle/0000_init.sql`
- `lib/db.ts`
- `lib/jwt.ts`
- `lib/auth-middleware.ts`
- `app/api/auth/*`
- `app/api/posts/*`
- `app/api/comments/route.ts`
