import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const runtime = "edge";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Login</h1>
      <AuthForm mode="login" />
      <p className="text-sm text-slate-600">
        No account?{" "}
        <Link href="/register" className="font-semibold text-accent">
          Create one
        </Link>
      </p>
    </section>
  );
}

