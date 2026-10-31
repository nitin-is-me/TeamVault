"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center shadow-2xl">
        <h1 className="mb-2 text-xl font-bold text-white">Something went wrong</h1>
        <p className="mb-6 text-sm text-slate-400">
          An unexpected error occurred while loading this page.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
