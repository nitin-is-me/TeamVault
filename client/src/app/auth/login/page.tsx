"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
         // Fallback if structure is different
         localStorage.setItem('token', data);
         router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-200">
      <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]"></div>
      
      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
        <div className="p-8">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block mb-4 text-indigo-400 hover:text-indigo-300">
              <span className="flex items-center justify-center gap-2 font-bold text-xl">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500"></div>
                TeamVault
              </span>
            </Link>
            <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
                <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</a>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
        <div className="border-t border-slate-800 bg-slate-900/80 px-8 py-4 text-center">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-indigo-400 hover:text-indigo-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
