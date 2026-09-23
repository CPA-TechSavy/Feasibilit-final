import React, { useState, useEffect } from 'react';
import {
  Clock,
  Mail,
  ShieldAlert,
  CheckCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  ADMIN_EMAIL,
  sendAdminNotificationEmail,
  subscribeToAccessApproval,
  AccessRequestRecord,
} from '../services/accessControlService';

interface AccessPendingScreenProps {
  user: {
    displayName?: string | null;
    email: string;
    photoURL?: string | null;
  };
  requestRecord?: AccessRequestRecord;
  onApproved: () => void;
  onSignOut: () => void;
}

export default function AccessPendingScreen({
  user,
  requestRecord,
  onApproved,
  onSignOut,
}: AccessPendingScreenProps) {
  const [reminderSent, setReminderSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    // Realtime subscription so the screen unlocks immediately when approved!
    const unsubscribe = subscribeToAccessApproval(user.email, (newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'approved') {
        onApproved();
      }
    });

    return () => unsubscribe();
  }, [user.email, onApproved]);

  const handleSendReminder = async () => {
    setIsSending(true);
    if (requestRecord?.approvalToken) {
      await sendAdminNotificationEmail(
        { email: user.email, displayName: user.displayName || user.email },
        requestRecord.approvalToken
      );
    }
    setIsSending(false);
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 5000);
  };

  // Gmail compose link for immediate direct communication with John Joebert Suarez
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    ADMIN_EMAIL
  )}&su=${encodeURIComponent(
    `[NoBSFeasibility Access Request] ${user.displayName || user.email}`
  )}&body=${encodeURIComponent(
    `Hello John Joebert Suarez, CPA,\n\nI have requested access to NoBSFeasibility with my Google account (${user.email}). Kindly approve my account so I can access and install the financial statements and feasibility engine.\n\nThank you!\n${user.displayName || user.email}`
  )}`;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
              <img src="/icon.svg" alt="Logo" className="w-full h-full rounded-[10px]" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              NoBS<span className="text-indigo-400">Feasibility</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-[11px] font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Awaiting Approval</span>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 mb-6">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-600" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {(user.displayName || user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-white truncate">{user.displayName || 'Google User'}</div>
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
          </div>
        </div>

        {/* Rejection Notice if rejected */}
        {status === 'rejected' ? (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-700/70 text-rose-200 text-xs mb-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Access Not Authorized</span>
            </div>
            <p>
              Your access request was declined by the administrator. If you believe this was an error, please contact John Joebert Suarez, CPA at{' '}
              <a href={`mailto:${ADMIN_EMAIL}`} className="underline font-semibold text-rose-100">
                {ADMIN_EMAIL}
              </a>
              .
            </p>
          </div>
        ) : (
          /* Pending Notice */
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Approval Required Before Entering or Installing</span>
              </h3>
              <p>
                To protect financial models and proprietary formulas, every Google account must be verified and approved by the owner before using or installing the website.
              </p>
              <p className="text-slate-400">
                A notification with direct approval controls has been delivered to administrator{' '}
                <span className="text-indigo-300 font-semibold">{ADMIN_EMAIL}</span>.
              </p>
            </div>

            <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-xl p-3 flex items-center gap-2.5 text-xs text-indigo-200">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              <span>
                Listening in real-time. This screen will automatically open the moment John Joebert Suarez approves your account.
              </span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {reminderSent ? (
            <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Notification Sent to {ADMIN_EMAIL}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSendReminder}
              disabled={isSending}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isSending ? 'Sending Notification...' : 'Resend Notification to Administrator'}</span>
            </button>
          )}

          {/* Open Gmail directly */}
          <a
            href={gmailComposeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 font-semibold text-xs border border-indigo-700/60 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-300" />
            <span>Open in Gmail to Contact Administrator</span>
            <ExternalLink className="w-3 h-3 text-indigo-400 ml-0.5" />
          </a>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer pt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign In with a Different Google Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
