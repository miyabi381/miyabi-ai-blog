import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const runtime = "edge";

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">アカウント作成</h1>
      <AuthForm mode="register" />
      <p className="text-sm text-slate-600">
        すでに登録済みの方は{" "}
        <Link href="/login" className="font-semibold text-accent">
          ログイン
        </Link>
      </p>
    </section>
  );
}

