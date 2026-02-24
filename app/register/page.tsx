import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const runtime = "edge";

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
      <AuthForm mode="register" />
      <p className="text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Login
        </Link>
      </p>
    </section>
  );
}

