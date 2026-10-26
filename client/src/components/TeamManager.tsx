"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Member {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface TeamManagerProps {
  projectId: string;
  onClose: () => void;
}

export default function TeamManager({ projectId, onClose }: TeamManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      setMembers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/projects/${projectId}/members`, { email, role });
      setSuccess('Team member added successfully!');
      setEmail('');
      fetchMembers(); // refresh list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: number) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchMembers(); // refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-white sm:text-xl">Manage Team</h2>
          <button onClick={onClose} aria-label="Close" className="-mr-1 shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:text-white">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 sm:p-6">
          {/* Invite Form */}
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:mb-8 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Invite Member</h3>
            <form onSubmit={handleInvite} className="flex gap-3 items-start flex-col sm:flex-row">
              <div className="flex-1 w-full">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-base text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:py-2 sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-32">
                 <select
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-base text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:py-2 sm:text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                 >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                 </select>
              </div>
              <button
                type="submit"
                disabled={isInviting}
                className="w-full rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-600 disabled:opacity-50 sm:w-auto sm:py-2"
              >
                {isInviting ? 'Adding...' : 'Add'}
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {success && <p className="mt-3 text-sm text-green-400">{success}</p>}
          </div>

          {/* Member List */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Current Members</h3>
            {loading ? (
              <div className="text-slate-400 text-sm py-4 text-center">Loading members...</div>
            ) : members.length === 0 ? (
               <div className="text-slate-500 text-sm py-4 text-center italic border border-slate-800 rounded-lg border-dashed">No team members yet.</div>
            ) : (
              <ul className="space-y-3">
                {members.map(member => (
                  <li key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800/30 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{member.name}</p>
                      <p className="truncate text-xs text-slate-400">{member.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                      <span className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300">
                        {member.role}
                      </span>
                      <button 
                        onClick={() => handleRemove(member.userId)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove member"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
