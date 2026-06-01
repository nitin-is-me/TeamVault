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
    } catch (error: any) {
      console.error("Failed to fetch projects", error);
      // If token expired or unauthorized
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/auth/login');
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
        
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Projects</h2>
            <p className="text-slate-400">Manage your team's projects and documentation.</p>
          </div>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            {isCreating ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {isCreating && (
          <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-2xl shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Project</h3>
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
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all"
              >
                Create
              </button>
            </form>
          </div>
        )}
        
        {projects.length === 0 && !isCreating ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl transition-transform hover:-translate-y-1 hover:border-indigo-500/50 group flex flex-col h-full cursor-pointer">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                    <p className="text-slate-400 mb-6 text-sm line-clamp-3">
                      {project.description || "No description provided."}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-500">
                    <span>Created by {project.createdByName}</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
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
