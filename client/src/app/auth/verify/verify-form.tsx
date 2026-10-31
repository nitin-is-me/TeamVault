"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function VerifyEmailForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const response = await api.post("/auth/verify-email", { email, code });
      const token = response.data?.token;

      if (!token) {
        throw new Error("The server returned an invalid verification response.");
      }

      localStorage.setItem("token", token);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not verify that code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setInfo("");

    try {
      await api.post("/auth/resend-verification", { email });
      setInfo("A new code has been sent. It expires in 10 minutes.");
      setCooldown(60);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not resend the code. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-200 sm:p-6">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[90px] sm:h-[500px] sm:w-[500px] sm:blur-[120px]"></div>

      <div className="z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center sm:mb-8">
            <Link href="/" className="inline-block mb-4 text-emerald-400 hover:text-emerald-300">
              <span className="flex items-center justify-center gap-2 font-bold text-xl">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-500 to-teal-500"></div>
                TeamVault
              </span>
            </Link>
            <h2 className="text-2xl font-semibold text-white">Check your email</h2>
            <p className="mt-2 text-sm text-slate-400">
              Enter the 6-digit code we sent to finish creating your account.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                {error}
              </div>
            )}

            {info && (
              <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20">
                {info}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="code">
                Verification code
              </label>
              <input
                id="code"
                type="text"
                required
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus={Boolean(initialEmail)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-6 flex w-full justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify email"
              )}
            </button>

            <div className="text-center text-sm text-slate-400">
              Didn&apos;t get a code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0 || !email}
                className="font-medium text-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        </div>

        <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-4 text-center sm:px-8">
          <p className="text-sm text-slate-400">
            Already verified?{" "}
            <Link href="/auth/login" className="font-medium text-emerald-400 hover:text-emerald-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
