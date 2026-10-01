"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { diffLines, Change } from 'diff';

export interface ArticleVersion {
  id: number;
  articleId: number;
  versionNumber: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: number;
  currentTitle: string;
  currentContent: string;
  canRestore: boolean;
  onRestored: (restoredArticle: any) => void;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  articleId,
  currentTitle,
  currentContent,
  canRestore,
  onRestored,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ArticleVersion | null>(null);
  const [viewMode, setViewMode] = useState<'diff' | 'preview'>('diff');
  const [diffMode, setDiffMode] = useState<'vs_current' | 'vs_previous'>('vs_current');
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && articleId) {
      fetchVersions();
    }
  }, [isOpen, articleId]);

  const fetchVersions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/articles/${articleId}/versions`);
      const data: ArticleVersion[] = res.data;
      setVersions(data);
      if (data.length > 0) {
        // Default to the previous version if available, otherwise the latest
        setSelectedVersion(data.length > 1 ? data[1] : data[0]);
      }
    } catch (err: any) {
      console.error("Failed to load version history", err);
      setError(err.response?.data?.message || 'Failed to fetch version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: ArticleVersion) => {
    const confirmed = window.confirm(
      `Are you sure you want to restore Version ${version.versionNumber}? This will replace the current content and create a new revision snapshot.`
    );
    if (!confirmed) return;

    setIsRestoring(true);
    setError('');
    try {
      const res = await api.post(`/articles/${articleId}/versions/${version.versionNumber}/restore`);
      onRestored(res.data);
      onClose();
    } catch (err: any) {
      console.error("Failed to restore version", err);
      setError(err.response?.data?.message || 'Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  // Find previous version for "vs_previous" diff
  const previousVersion = selectedVersion
    ? versions.find((v) => v.versionNumber === selectedVersion.versionNumber - 1)
    : null;

  // Base text to compare against:
  const baseContent = diffMode === 'vs_previous' && previousVersion
    ? previousVersion.content
    : selectedVersion?.content || '';

  const targetContent = diffMode === 'vs_previous' && selectedVersion
    ? selectedVersion.content
    : currentContent;

  const diffResult: Change[] = selectedVersion
    ? diffLines(baseContent, targetContent)
    : [];

  const isCurrentVersion =
    selectedVersion && versions.length > 0 && selectedVersion.id === versions[0].id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Version History & Revisions</h2>
              <p className="text-xs text-slate-400">Inspect line-by-line diffs and restore previous checkpoints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Main Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar: Versions Timeline */}
            <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/40">
              <div className="p-4 border-b border-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Revisions ({versions.length})
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {versions.map((v, index) => {
                  const isLatest = index === 0;
                  const isSelected = selectedVersion?.id === v.id;
                  const date = new Date(v.createdAt);

                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersion(v)}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-sm ring-1 ring-indigo-500/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                          v{v.versionNumber}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold truncate text-slate-200 mb-1">
                        {v.title}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate max-w-[120px]">{v.authorName}</span>
                        <span>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Diff or Preview */}
            <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
              {selectedVersion ? (
                <>
                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/20">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => setViewMode('diff')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            viewMode === 'diff'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Visual Diff
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('preview')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            viewMode === 'preview'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Markdown Preview
                        </button>
                      </div>

                      {viewMode === 'diff' && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
                          <span>Compare:</span>
                          <select
                            value={diffMode}
                            onChange={(e) => setDiffMode(e.target.value as any)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="vs_current">v{selectedVersion.versionNumber} vs Current Version</option>
                            {previousVersion && (
                              <option value="vs_previous">v{previousVersion.versionNumber} &rarr; v{selectedVersion.versionNumber}</option>
                            )}
                          </select>
                        </div>
                      )}
                    </div>

                    {canRestore && !isCurrentVersion && (
                      <button
                        onClick={() => handleRestore(selectedVersion)}
                        disabled={isRestoring}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        {isRestoring ? 'Restoring...' : `Restore Version ${selectedVersion.versionNumber}`}
                      </button>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
                    {/* Title comparison notice */}
                    {selectedVersion.title !== currentTitle && (
                      <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-sans text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold">Title changed: </span>
                          <span className="line-through text-slate-400 mr-2">"{selectedVersion.title}"</span>
                          &rarr;
                          <span className="text-white ml-2">"{currentTitle}"</span>
                        </div>
                      </div>
                    )}

                    {viewMode === 'preview' ? (
                      <div className="font-sans">
                        <div className="mb-4 pb-4 border-b border-slate-800">
                          <h1 className="text-2xl font-bold text-white mb-1">{selectedVersion.title}</h1>
                          <p className="text-xs text-slate-400">
                            Authored by {selectedVersion.authorName} on {new Date(selectedVersion.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <article className="prose prose-invert prose-indigo max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedVersion.content}
                          </ReactMarkdown>
                        </article>
                      </div>
                    ) : (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/60 font-sans text-[11px] text-slate-400">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Added lines
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Removed lines
                            </span>
                          </div>
                          <span>
                            {diffMode === 'vs_previous' && previousVersion
                              ? `Changes from v${previousVersion.versionNumber} to v${selectedVersion.versionNumber}`
                              : `Changes between v${selectedVersion.versionNumber} and current`}
                          </span>
                        </div>

                        <div className="p-4 leading-relaxed overflow-x-auto whitespace-pre">
                          {diffResult.length === 0 || (diffResult.length === 1 && !diffResult[0].added && !diffResult[0].removed) ? (
                            <div className="text-slate-500 italic py-6 text-center font-sans text-xs">
                              No textual differences between these versions.
                            </div>
                          ) : (
                            diffResult.map((part, idx) => {
                              const lines = part.value.replace(/\n$/, '').split('\n');
                              return lines.map((line, lineIdx) => {
                                if (part.added) {
                                  return (
                                    <div
                                      key={`${idx}-${lineIdx}`}
                                      className="bg-emerald-950/40 text-emerald-300 px-3 py-0.5 rounded -mx-2 flex gap-3 border-l-2 border-emerald-500"
                                    >
                                      <span className="select-none text-emerald-500 font-bold w-4 text-right">+</span>
                                      <span className="flex-1">{line || ' '}</span>
                                    </div>
                                  );
                                }
                                if (part.removed) {
                                  return (
                                    <div
                                      key={`${idx}-${lineIdx}`}
                                      className="bg-rose-950/40 text-rose-300 px-3 py-0.5 rounded -mx-2 flex gap-3 border-l-2 border-rose-500"
                                    >
                                      <span className="select-none text-rose-500 font-bold w-4 text-right">-</span>
                                      <span className="flex-1">{line || ' '}</span>
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    key={`${idx}-${lineIdx}`}
                                    className="text-slate-400 px-3 py-0.5 flex gap-3 opacity-80"
                                  >
                                    <span className="select-none text-slate-600 w-4 text-right"> </span>
                                    <span className="flex-1">{line || ' '}</span>
                                  </div>
                                );
                              });
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  Select a version from the left panel to inspect changes
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
