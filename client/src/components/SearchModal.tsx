"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface SearchProject {
  id: number;
  name: string;
  description: string;
}

interface SearchArticle {
  id: number;
  projectId: number;
  title: string;
  authorName: string;
}

interface SearchResults {
  projects: SearchProject[];
  articles: SearchArticle[];
}

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ projects: [], articles: [] });
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleCustomOpen);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ projects: [], articles: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0 && isOpen) {
        performSearch();
      } else {
        setResults({ projects: [], articles: [] });
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToProject = (id: number) => {
    setIsOpen(false);
    router.push(`/dashboard/projects/${id}`);
  };

  const navigateToArticle = (projectId: number, articleId: number) => {
    setIsOpen(false);
    router.push(`/dashboard/projects/${projectId}/articles/${articleId}`);
  };

  if (!isOpen) return null;

  const hasResults = results.projects.length > 0 || results.articles.length > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center items-start pt-[15vh]">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white text-lg placeholder-slate-500 focus:outline-none"
            placeholder="Search projects and articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Type to start searching globally across all your projects and articles.
            </div>
          ) : loading ? (
            <div className="p-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No results found for "{query}".
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {results.projects.length > 0 && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Projects</h3>
                  <div className="space-y-1">
                    {results.projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigateToProject(p.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex flex-col group"
                      >
                        <span className="text-sm font-medium text-slate-200 group-hover:text-indigo-400">{p.name}</span>
                        <span className="text-xs text-slate-500 truncate">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.articles.length > 0 && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Articles</h3>
                  <div className="space-y-1">
                    {results.articles.map(a => (
                      <button
                        key={a.id}
                        onClick={() => navigateToArticle(a.projectId, a.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex flex-col group"
                      >
                        <span className="text-sm font-medium text-slate-200 group-hover:text-indigo-400">{a.title}</span>
                        <span className="text-xs text-slate-500">By {a.authorName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
    </div>
  );
}
