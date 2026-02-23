import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Miyabi Blog",
  description: "Qiita-style blog platform on Cloudflare Pages + D1"
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

