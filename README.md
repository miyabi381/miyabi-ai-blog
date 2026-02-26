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
- リッチMarkdownエディタ（見出し / 引用 / リスト / チェックリスト / リンク / 区切り線）
- コメント
- 投稿 / 一覧表示
- ログインユーザーのみ投稿可能
- プロフィール
- ユーザー情報表示
- ユーザー投稿一覧
- 表示名・アバター更新
- リアクション（いいね / お気に入り）
- フォロー / フォロー解除

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts?postId=`
- `PATCH /api/posts?postId=`
- `DELETE /api/posts?postId=`
- `GET /api/posts/reactions?postId=`
- `POST /api/posts/reactions`
- `GET /api/comments?postId=`
- `POST /api/comments`
- `POST /api/users/follows`
- `PATCH /api/profile/avatar`

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

3. 開発起動

```bash
npm run dev
```

`lib/db.ts` がローカル実行時に `.local/dev.sqlite` を自動生成し、`migrations/*.sql` を自動適用します。

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

## Cloudflare 本番公開

1. Cloudflare にログイン

```bash
npx wrangler whoami
```

2. D1 の本番マイグレーションを適用

```bash
npm run db:migrate:remote
```

3. Pages Secret に `JWT_SECRET` を設定

```bash
wrangler pages secret put JWT_SECRET --project-name miyabi-ai-blog
```

4. ビルドとデプロイ

```bash
npm run pages:build
npm run pages:deploy
```

## Notes

- `wrangler.toml` で `migrations_dir = "migrations"` を指定しています。
- `wrangler.toml` の `database_id` は実際の D1 ID に変更してください（`000...` のままだと本番で動作しません）。
- `postinstall` で `scripts/patch-cloudflare-tooling.js` が実行され、
  Windows 環境での `@cloudflare/next-on-pages` / `wrangler` 実行互換性を補正します。
- `npm run build` の最後に `scripts/fix-cloudflare-root-route.js` を実行し、
  まれに `/` が `Not Found` になる `next-on-pages` のルート生成不整合を補正します。

## D1 Schema

- `users`
- `id`, `username`, `display_name`, `email`, `avatar_url`, `hashed_password`, `created_at`
- `posts`
- `id`, `user_id`, `title`, `content`, `created_at`
- `comments`
- `id`, `post_id`, `user_id`, `parent_comment_id`, `content`, `created_at`
- `post_likes`
- `id`, `post_id`, `user_id`, `created_at`
- `post_favorites`
- `id`, `post_id`, `user_id`, `created_at`
- `user_follows`
- `id`, `follower_user_id`, `following_user_id`, `created_at`

## Important Files

- `db/schema.ts`
- `migrations/0000_init.sql`
- `lib/db.ts`
- `lib/jwt.ts`
- `lib/auth-middleware.ts`
- `app/api/auth/*`
- `app/api/posts/*`
- `app/api/comments/route.ts`
