import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center shadow-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">404</p>
        <h1 className="mb-2 text-xl font-bold text-white">Page not found</h1>
        <p className="mb-6 text-sm text-slate-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
