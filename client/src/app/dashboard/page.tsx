"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Project {
  id: number;
  name: string;
  description: string;
  createdByName: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // New Project Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [createError, setCreateError] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      setFetchError('');
    } catch (error: any) {
      console.error("Failed to fetch projects", error);
      // A 401 means the session expired; the Axios interceptor handles the redirect.
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth/login');
      } else {
        setFetchError(error.response?.data?.message || 'Failed to load projects. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/projects', { name: newProjectName, description: newProjectDesc });
      setIsCreating(false);
      setNewProjectName('');
      setNewProjectDesc('');
      fetchProjects(); // Refresh the list
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create project');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-200 px-4 py-5 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-center justify-between gap-3 sm:mb-12">
          <Link href="/" className="flex min-w-0 items-center gap-2 hover:opacity-80 transition-opacity sm:gap-3">
             <img src="/favicon.ico" alt="Logo" className="w-7 h-7 shrink-0 rounded shadow-lg sm:w-8 sm:h-8" />
             <h1 className="truncate text-lg font-bold text-white tracking-tight sm:text-2xl">TeamVault</h1>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
             <button
               onClick={() => window.dispatchEvent(new Event('open-search'))}
               aria-label="Search projects and articles"
               className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-400 transition-colors hover:text-white sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-slate-500 bg-slate-800 rounded">⌘K</kbd>
             </button>
             <button 
               onClick={() => { localStorage.removeItem('token'); router.push('/'); }}
               aria-label="Sign out"
               className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-0 text-sm font-medium transition-colors hover:border-slate-600 hover:bg-slate-700 w-10 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
             >
               <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
               <span className="hidden sm:inline">Sign Out</span>
             </button>
          </div>
        </header>
        
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-white sm:mb-2 sm:text-3xl">Projects</h2>
            <p className="text-sm text-slate-400 sm:text-base">Manage your team's projects and documentation.</p>
          </div>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className={`w-full shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all sm:w-auto sm:py-2 ${isCreating ? 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:bg-indigo-600'}`}
          >
            {isCreating ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {fetchError}
          </div>
        )}

        {isCreating && (
          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 shadow-xl backdrop-blur-sm sm:mb-8 sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-white sm:text-xl">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4 max-w-xl">
              {createError && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="name">Project Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="desc">Description</label>
                <textarea
                  id="desc"
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-600 sm:w-auto sm:py-2"
              >
                Create
              </button>
            </form>
          </div>
        )}
        
        {projects.length === 0 && !isCreating ? (
          <div className="rounded-2xl border border-slate-800 border-dashed bg-slate-900/30 px-4 py-16 text-center sm:py-20">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">Get started by creating a new project for your team.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {projects.map((project) => (
              <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
                <div className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl backdrop-blur-sm transition-transform hover:-translate-y-1 hover:border-indigo-500/50 sm:p-6">
                  <div className="flex-1">
                    <h3 className="mb-2 break-words text-lg font-semibold text-white transition-colors group-hover:text-indigo-400 sm:text-xl">{project.name}</h3>
                    <p className="mb-5 text-sm text-slate-400 line-clamp-3 sm:mb-6">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/50 pt-4 text-xs text-slate-500">
                    <span className="min-w-0 truncate">Created by {project.createdByName}</span>
                    <span className="shrink-0">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
