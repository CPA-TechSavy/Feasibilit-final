import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Search,
  RefreshCw,
  X,
  Mail,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  fetchAllAccessRequests,
  setAccessStatus,
  AccessRequestRecord,
  ADMIN_EMAIL,
} from '../services/accessControlService';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchAllAccessRequests();
      setRequests(data);
    } catch (e) {
      console.error('Error loading requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  const handleUpdateStatus = async (email: string, status: 'approved' | 'rejected') => {
    try {
      await setAccessStatus(email, status);
      setActionMessage(
        status === 'approved'
          ? `Granted access to ${email}! They can now use and install the website.`
          : `Revoked access for ${email}.`
      );
      setTimeout(() => setActionMessage(null), 4000);
      loadRequests();
    } catch (err: any) {
      alert(`Failed to update status: ${err?.message || err}`);
    }
  };

  if (!isOpen) return null;

  const filteredRequests = requests.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">User Access Management</h2>
            <p className="text-xs text-slate-500">
              Control which Google accounts are permitted to use and install NoBSFeasibility
            </p>
          </div>
        </div>

        {/* Admin status banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">Administrator:</span>
            <span>{ADMIN_EMAIL}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-300">
              {pendingCount} Pending Approval
            </span>
          </div>
        </div>

        {/* Action feedback */}
        {actionMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* List of Requests */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
              <span>Loading registered access requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No user access requests found.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.email}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {req.photoURL ? (
                    <img
                      src={req.photoURL}
                      alt={req.displayName}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {req.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                      <span>{req.displayName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{req.email}</div>
                    <div className="text-[10px] text-slate-400">
                      Requested: {new Date(req.requestedAt).toLocaleDateString()}{' '}
                      {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {req.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.email, 'approved')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve Access</span>
                    </button>
                  )}

                  {req.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(req.email, 'rejected')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Approved users have persistent access and do not need repeated approvals.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
