import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 text-white">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-500/20 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-500/20 blur-[120px]"></div>

      <main className="z-10 flex flex-col items-center text-center px-6 max-w-4xl">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-indigo-300 backdrop-blur-md mb-8">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
          TeamVault v1.1 is here
        </div>

        <h1 className="mb-6 text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          The Knowledge Hub for <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Modern Teams</span>
        </h1>

        <p className="mb-10 text-lg md:text-xl text-slate-400 max-w-2xl">
          Centralize your project documentation, API specs, and team knowledge in one beautifully organized, secure workspace.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/auth/register" className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-500 px-8 font-medium text-white transition-all hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            Get Started Free
          </Link>
          <Link href="/auth/login" className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 backdrop-blur-sm px-8 font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-600">
            Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
