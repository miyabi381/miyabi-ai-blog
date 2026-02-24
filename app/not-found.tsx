import Link from "next/link";

export default function NotFound() {
  return (
    <section className="card mx-auto max-w-xl space-y-4 p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-slate-600">Requested page does not exist.</p>
      <Link href="/" className="mx-auto inline-flex rounded-lg bg-ink px-4 py-2 font-semibold text-white">
        Back to Home
      </Link>
    </section>
  );
}
