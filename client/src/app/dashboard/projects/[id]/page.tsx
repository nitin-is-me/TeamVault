"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import TeamManager from '@/components/TeamManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Article {
  id: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  currentUserRole: string;
}

export default function ProjectWorkspace() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  
  // New Article Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    if (projectId) {
      fetchData();
    }
  }, [projectId, router]);

  const fetchData = async () => {
    try {
      // Fetch both project details and its articles in parallel
      const [projectRes, articlesRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/articles`)
      ]);
      setProject(projectRes.data);
      setArticles(articlesRes.data);
    } catch (error: any) {
      console.error("Failed to fetch data", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/auth/login');
      } else if (error.response?.status === 404) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/articles`, { title: newTitle, content: newContent });
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      // Refresh the articles list
      const articlesRes = await api.get(`/projects/${projectId}/articles`);
      setArticles(articlesRes.data);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This will permanently delete all articles and remove all team members. This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/projects/${projectId}`);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
             <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors flex items-center justify-center h-10 w-10 rounded-lg bg-slate-900 border border-slate-800">
               &larr;
             </Link>
             <div>
               <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
               <p className="text-sm text-slate-400 line-clamp-1 max-w-md">{project.description}</p>
             </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event('open-search'))}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-slate-500 bg-slate-800 rounded">⌘K</kbd>
          </button>
        </header>
        
        <div className="mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Knowledge Base</h2>
            <p className="text-sm text-slate-400">All documentation for this project.</p>
          </div>
          <div className="flex gap-3">
            {project.currentUserRole === 'OWNER' && (
              <>
                <button 
                  onClick={() => setShowTeamManager(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Team
                </button>
                <button 
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Delete Project
                </button>
              </>
            )}
            {project.currentUserRole !== 'VIEWER' && (
              <button 
                onClick={() => setIsCreating(!isCreating)}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                {isCreating ? 'Cancel' : '+ New Article'}
              </button>
            )}
          </div>
        </div>

        {isCreating && (
          <div className="mb-8 p-6 bg-slate-900/80 border border-slate-700 rounded-2xl shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
            <h3 className="text-xl font-semibold text-white mb-4">Write New Article</h3>
            <form onSubmit={handleCreateArticle} className="space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                  {createError}
                </div>
              )}
              <div>
                <input
                  type="text"
                  required
                  placeholder="Article Title (e.g., Local Setup Guide)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-lg font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="block text-sm font-medium text-slate-300">Content</label>
                  <div className="flex items-center bg-slate-800 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('write')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'write' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'preview' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                
                {activeTab === 'write' ? (
                  <textarea
                    id="content"
                    required
                    rows={8}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors font-mono text-sm leading-relaxed"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                ) : (
                  <div className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 min-h-[200px] max-h-[400px] overflow-y-auto">
                    <article className="prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {newContent || '*Nothing to preview*'}
                       </ReactMarkdown>
                    </article>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                 <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all"
                 >
                   Cancel
                 </button>
                 <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
                 >
                  {isSubmitting ? 'Saving...' : 'Publish Article'}
                 </button>
              </div>
            </form>
          </div>
        )}
        
        {articles.length === 0 && !isCreating ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No documentation yet</h3>
            <p className="text-slate-400 mb-6">Start building your team's knowledge base.</p>
            {project.currentUserRole !== 'VIEWER' && (
              <button 
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 mt-6"
              >
                Write First Article
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {articles.map((article) => (
              <Link href={`/dashboard/projects/${projectId}/articles/${article.id}`} key={article.id}>
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/50 group flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                       <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                       {article.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>By {article.authorName}</span>
                      <span>&bull;</span>
                      <span>Updated {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-slate-600 group-hover:text-indigo-400 transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {showTeamManager && projectId && (
        <TeamManager projectId={projectId as string} onClose={() => setShowTeamManager(false)} />
      )}
    </div>
  );
}
