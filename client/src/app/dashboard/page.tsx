"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg"></div>
             <h1 className="text-2xl font-bold text-white tracking-tight">TeamVault</h1>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('token'); router.push('/'); }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
          >
            Sign Out
          </button>
        </header>
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-slate-400">Welcome to your team's knowledge hub.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1 hover:border-slate-700">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Projects</h3>
            <p className="text-slate-400 mb-4 text-sm">Manage your team's projects and documentation in one place.</p>
            <button className="text-indigo-400 hover:text-indigo-300 font-medium text-sm flex items-center gap-1 group">
              View Projects 
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1 hover:border-slate-700">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Team Members</h3>
            <p className="text-slate-400 mb-4 text-sm">Invite colleagues and manage access levels for your team.</p>
            <button className="text-purple-400 hover:text-purple-300 font-medium text-sm flex items-center gap-1 group">
              Manage Team 
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1 hover:border-slate-700">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
            <p className="text-slate-400 mb-4 text-sm">Configure your workspace preferences and personal profile.</p>
            <button className="text-emerald-400 hover:text-emerald-300 font-medium text-sm flex items-center gap-1 group">
              Workspace Settings 
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
