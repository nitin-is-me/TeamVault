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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">Manage Team</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {/* Invite Form */}
          <div className="mb-8 bg-slate-800/50 p-5 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Invite Member</h3>
            <form onSubmit={handleInvite} className="flex gap-3 items-start flex-col sm:flex-row">
              <div className="flex-1 w-full">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-32">
                 <select
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
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
                className="w-full sm:w-auto px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
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
                  <li key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded font-medium">
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
