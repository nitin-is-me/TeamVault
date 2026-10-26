"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-950 text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute top-[-10%] left-[-25%] h-[40%] w-[70%] rounded-full bg-indigo-500/20 blur-[100px] sm:left-[-10%] sm:w-[40%] sm:blur-[120px]"></div>
      <div className="pointer-events-none absolute bottom-[-10%] right-[-25%] h-[40%] w-[70%] rounded-full bg-purple-500/20 blur-[100px] sm:right-[-10%] sm:w-[40%] sm:blur-[120px]"></div>

      <main className="z-10 flex w-full max-w-4xl flex-col items-center px-5 py-16 text-center sm:px-6 sm:py-20">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-md sm:mb-8 sm:px-4 sm:text-sm">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          TeamVault v1.2.1 is here
        </div>

        <h1 className="mb-4 text-balance text-[2.125rem] leading-[1.1] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 sm:mb-6 sm:text-5xl md:text-7xl">
          The Knowledge Hub for <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Modern Teams</span>
        </h1>

        <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-400 sm:mb-10 sm:text-lg md:text-xl">
          Centralize your project documentation, API specs, and team knowledge in one beautifully organized, secure workspace.
        </p>

        <div className="flex min-h-[48px] w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          ) : isLoggedIn ? (
            <Link href="/dashboard" className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-indigo-500 px-8 font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:bg-indigo-600 active:scale-95 sm:w-auto">
              Go to Dashboard &rarr;
            </Link>
          ) : (
            <>
              <Link href="/auth/register" className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-indigo-500 px-8 font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:bg-indigo-600 active:scale-95 sm:w-auto">
                Get Started Free
              </Link>
              <Link href="/auth/login" className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 px-8 font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white sm:w-auto">
                Sign In
              </Link>
            </>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-sm text-slate-500 sm:mt-16">
          <p>
            Made by{' '}
            <a href="https://github.com/nitin-is-me" target="_blank" className="font-medium text-slate-300 transition-colors hover:text-indigo-400">
              @nitin-is-me
            </a>
          </p>
          <a
            href="https://github.com/nitin-is-me/teamvault"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Source Code
          </a>
        </div>
      </main>
    </div>
  );
}
