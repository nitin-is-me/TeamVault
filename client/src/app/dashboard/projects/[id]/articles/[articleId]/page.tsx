"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VersionHistoryModal from '@/components/VersionHistoryModal';

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
  const [accessError, setAccessError] = useState('');

  // Version History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/auth/login');
      } else if (error.response?.status === 404) {
        router.push(`/dashboard/projects/${projectId}`);
      } else {
        setAccessError(error.response?.data?.message || 'You do not have access to this article.');
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

  const handleDeleteArticle = async () => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/articles/${articleId}`);
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete article');
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
      <div className="flex min-h-dvh items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!article) {
    if (accessError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <h1 className="mb-2 text-lg font-semibold text-white">Article unavailable</h1>
            <p className="mb-6 text-sm text-red-400">{accessError}</p>
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="inline-flex rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              Back to Project
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-200 px-4 py-5 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
            <Link href={`/dashboard/projects/${projectId}`} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-400 sm:gap-2">
               &larr; Back to Project
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <button 
                onClick={() => setIsHistoryOpen(true)}
                aria-label="Version history"
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white sm:h-auto sm:px-4 sm:py-1.5"
                title="View version history and visual diffs"
              >
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">History</span>
              </button>

              {project?.currentUserRole !== 'VIEWER' && (
                <>
                  <button 
                    onClick={toggleEdit}
                    aria-label={isEditing ? 'Cancel editing' : 'Edit article'}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 sm:h-auto sm:px-4 sm:py-1.5"
                  >
                    {isEditing ? 'Cancel Editing' : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        <span className="hidden sm:inline">Edit Article</span>
                      </>
                    )}
                  </button>
                  {!isEditing && (
                    <button 
                      onClick={handleDeleteArticle}
                      aria-label="Delete article"
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 hover:text-red-400 sm:h-auto sm:px-4 sm:py-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      <span className="hidden sm:inline">Delete Article</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {!isEditing && (
            <>
              <h1 className="mb-3 break-words text-2xl font-extrabold text-white tracking-tight sm:mb-4 sm:text-3xl md:text-4xl">{article.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-800 pb-5 text-sm text-slate-400 sm:pb-6">
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
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 shadow-xl animate-in fade-in slide-in-from-top-4 sm:p-6">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-base font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors sm:text-lg"
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
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:py-1 ${activeTab === 'write' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:py-1 ${activeTab === 'preview' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-base text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors font-mono leading-relaxed sm:text-sm"
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
                  className="w-full rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-600 disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)] sm:w-auto"
                 >
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                 </button>
              </div>
            </form>
          </div>
        ) : (
          <article className="prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 rounded-xl border border-slate-800 bg-slate-900/30 p-4 shadow-inner sm:p-6">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content}
             </ReactMarkdown>
          </article>
        )}

        {/* Version History Modal */}
        <VersionHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          articleId={article.id}
          currentTitle={article.title}
          currentContent={article.content}
          canRestore={project?.currentUserRole !== 'VIEWER'}
          onRestored={(restored) => {
            setArticle(restored);
          }}
        />
      </div>
    </div>
  );
}
