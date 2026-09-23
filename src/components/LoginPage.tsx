import React, { useState } from 'react';
import { signInWithGoogle, type User } from '../firebase';
import {
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  BarChart3,
  Layers,
  Download,
  CheckCircle2,
  AlertCircle,
  Lock,
  Clock,
} from 'lucide-react';
import { ADMIN_EMAIL } from '../services/accessControlService';

interface LoginPageProps {
  onSuccessLogin: (user: User) => void;
  inactivityNotice?: boolean;
}

export default function LoginPage({
  onSuccessLogin,
  inactivityNotice = false,
}: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInstallWarning, setShowInstallWarning] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      onSuccessLogin(user);
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in popup was closed before completing. Please try again.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage(
          'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.'
        );
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection error. Please verify your internet connection and retry.');
      } else {
        setErrorMessage(
          err?.message || 'Unable to complete Google sign-in. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-lg flex items-center justify-center">
            <img src="/icon.svg" alt="Logo" className="w-full h-full rounded-[10px]" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block">
              NoBS<span className="text-indigo-400">Feasibility</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Professional Financial Engine
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInstallWarning(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Install / Download App</span>
        </button>
      </header>

      {/* Inactivity Logout Notice */}
      {inactivityNotice && (
        <div className="w-full max-w-2xl mx-auto px-4 z-20 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-2xl bg-amber-950/90 border border-amber-600/80 text-amber-200 text-xs font-medium flex items-center gap-3 shadow-xl">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-amber-100">Session Expired (3 Hours of Inactivity):</span>{' '}
              For your data protection, the website automatically logged out. Please sign in with your Google account to resume your work.
            </div>
          </div>
        </div>
      )}

      {/* Main Hero & Sign-in Gate */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Product Value Highlights */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Owner Approval Required &bull; Protected Access</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Build rigorous, bank-ready{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400">
                feasibility studies
              </span>{' '}
              without the spreadsheet chaos.
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Automatic 5-year Income Statements, Balance Sheets, Cash Flows, Working Capital,
              Break-Even Points, and NPV/IRR evaluations with 1-page A4 landscape PDF reporting.
            </p>

            {/* Feature Checkpoints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">5-Year Financial Statements</h3>
                  <p className="text-[11px] text-slate-400">Clean, interconnected GAAP statements.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Financial Ratios &amp; Verdict</h3>
                  <p className="text-[11px] text-slate-400">ROI, Payback, NPV, IRR &amp; Solvency.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Manufacturing Costing</h3>
                  <p className="text-[11px] text-slate-400">BOM, direct labor, and factory overhead.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <TrendingUp className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">1-Page A4 PDF Downloads</h3>
                  <p className="text-[11px] text-slate-400">Highlightable text &amp; single-page layout.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Login Box */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 relative backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/40 flex items-center justify-center mb-5 text-indigo-400">
                <Lock className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-white mb-1.5">Sign In to Continue</h2>
              <p className="text-xs text-slate-400 mb-6">
                Please log in with your Google account. Access and installation are granted upon administrator approval.
              </p>

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{loading ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
              </button>

              {/* Trust Badge */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Authorized by John Joebert Suarez, CPA</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  New Google accounts require administrator approval via Gmail before entry or installation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pre-login Install Attempt Warning Modal */}
      {showInstallWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-600/50 text-amber-400 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Google Account Required to Install</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Before you can install or download the website to your phone or computer, you must first sign in with your Google account and receive approval from the administrator ({ADMIN_EMAIL}).
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInstallWarning(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                Sign In with Google First
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-900 z-10 gap-2">
        <p>&copy; 2026 NoBSFeasibility. All financial formulas comply with standard GAAP / PFRS methodology.</p>
        <p className="flex items-center gap-2">
          <span>Manufacturing Industry Profile</span>
          <span>&bull;</span>
          <span>5-Year Forecast</span>
        </p>
      </footer>
    </div>
  );
}
