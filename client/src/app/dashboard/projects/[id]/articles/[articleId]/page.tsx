"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
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

export default function ArticleViewer() {
  const router = useRouter();
  const params = useParams<{ id: string; articleId: string }>();
  const projectId = params?.id;
  const articleId = params?.articleId;

  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [project, setProject] = useState<any>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    if (articleId) {
      fetchArticle();
    }
  }, [articleId, router]);

  const fetchArticle = async () => {
    try {
      const [artRes, projRes] = await Promise.all([
        api.get(`/articles/${articleId}`),
        api.get(`/projects/${projectId}`)
      ]);
      setArticle(artRes.data);
      setProject(projRes.data);
    } catch (error: any) {
      console.error("Failed to fetch article", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        router.push('/auth/login');
      } else if (error.response?.status === 404) {
        router.push(`/dashboard/projects/${projectId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await api.put(`/articles/${articleId}`, { title: editTitle, content: editContent });
      setArticle(res.data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEdit = () => {
    if (!isEditing && article) {
      setEditTitle(article.title);
      setEditContent(article.content);
      setError('');
    }
    setIsEditing(!isEditing);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href={`/dashboard/projects/${projectId}`} className="text-slate-500 hover:text-indigo-400 transition-colors inline-flex items-center gap-2 text-sm font-medium">
               &larr; Back to Project
            </Link>
            {project?.currentUserRole !== 'VIEWER' && (
              <button 
                onClick={toggleEdit}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2"
              >
                {isEditing ? 'Cancel Editing' : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Edit Article
                  </>
                )}
              </button>
            )}
          </div>
          
          {!isEditing && (
            <>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">{article.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400 border-b border-slate-800 pb-6">
                <span className="flex items-center gap-1.5">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                   {article.authorName}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}
                </span>
              </div>
            </>
          )}
        </header>

        {isEditing ? (
          <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="title">Article Title</label>
                <input
                  id="title"
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-lg font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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
                    rows={15}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors font-mono text-sm leading-relaxed"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                ) : (
                  <div className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 min-h-[350px] max-h-[500px] overflow-y-auto">
                    <article className="prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {editContent || '*Nothing to preview*'}
                       </ReactMarkdown>
                    </article>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                 <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                 >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                 </button>
              </div>
            </form>
          </div>
        ) : (
          <article className="prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 p-6 bg-slate-900/30 rounded-xl border border-slate-800 shadow-inner">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
             </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  );
}
