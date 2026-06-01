"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

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
      const res = await api.get(`/articles/${articleId}`);
      setArticle(res.data);
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
        <header className="mb-10">
          <Link href={`/dashboard/projects/${projectId}`} className="text-slate-500 hover:text-indigo-400 transition-colors inline-flex items-center gap-2 mb-6 text-sm font-medium">
             &larr; Back to Project
          </Link>
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
        </header>

        <article className="prose prose-invert prose-indigo max-w-none">
           {/* Note: In V2 we will use react-markdown here. For now, preserving whitespace. */}
           <div className="whitespace-pre-wrap font-mono text-slate-300 leading-relaxed p-6 bg-slate-900/50 rounded-xl border border-slate-800 shadow-inner">
              {article.content}
           </div>
        </article>
      </div>
    </div>
  );
}
