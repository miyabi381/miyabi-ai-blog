import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Miyabi Blog",
  description: "Cloudflare Pages + D1 で動作するQiita風ブログプラットフォーム"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Navbar />
        <main className="page-shell py-8">{children}</main>
      </body>
    </html>
  );
}
