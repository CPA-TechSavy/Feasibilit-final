import { useState, useMemo, useEffect, useCallback, ComponentType } from 'react';
import { FeasibilityProject } from './types';
import { BLANK_PROJECT, SAMPLE_PROJECTS } from './data/sampleProjects';
import {
  calculate5YearFinancials,
  calculateFeasibilityMetrics,
} from './utils/financialCalculations';
import Header from './components/Header';
import ProjectInfoCard from './components/ProjectInfoCard';
import AssumptionsEditor from './components/AssumptionsEditor';
import FinancialStatementsView from './components/FinancialStatementsView';
import FeasibilityEvaluationView from './components/FeasibilityEvaluationView';
import SupportingSchedulesView from './components/SupportingSchedulesView';
import NotesAndDefenseNotes from './components/NotesAndDefenseNotes';
import CloudflareDeployModal from './components/CloudflareDeployModal';
import BankInterestAndLoanModal from './components/BankInterestAndLoanModal';
import CompanyAccountModal from './components/CompanyAccountModal';
import LoginPage from './components/LoginPage';
import InstallAppModal from './components/InstallAppModal';
import AccessPendingScreen from './components/AccessPendingScreen';
import AdminAccessModal from './components/AdminAccessModal';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import { auth, logOut, onAuthStateChanged } from './firebase';
import {
  checkIsAdmin,
  checkAccessStatus,
  requestWebsiteAccess,
  handleUrlApprovalAction,
  AccessRequestRecord,
} from './services/accessControlService';
import {
  FileText,
  BarChart3,
  Sliders,
  Table,
  BookOpen,
  Cloud,
  CheckCircle2,
  Landmark,
  ChevronDown,
} from 'lucide-react';

const STORAGE_KEY = 'undergrad_feasibility_cleanslate_v1';

type MainViewType = 'statements' | 'evaluation' | 'assumptions' | 'schedules' | 'notes';

const NAV_ITEMS: {
  id: MainViewType;
  label: string;
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: 'statements', label: 'Financial Statements', shortLabel: 'Statements', icon: FileText },
  { id: 'evaluation', label: 'Financial Ratios & Verdict', shortLabel: 'Ratios', icon: BarChart3 },
  { id: 'assumptions', label: 'Assumptions & Inputs', shortLabel: 'Assumptions', icon: Sliders },
  { id: 'schedules', label: 'Notes Schedules', shortLabel: 'Schedules', icon: Table },
  { id: 'notes', label: 'Notes to Statements', shortLabel: 'Notes', icon: BookOpen },
];

export default function App() {
  const [project, setProject] = useState<FeasibilityProject>(() => {
    try {
      // Clear out legacy sample pre-existing data
      localStorage.removeItem('undergrad_feasibility_project_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'cafe-artisan' || parsed.id === 'eco-packaging') {
          return BLANK_PROJECT;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load project from localStorage', e);
    }
    return BLANK_PROJECT;
  });

  const [activeMainView, setActiveMainView] = useState<MainViewType>('statements');

  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // PWA installation hook
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showInstructions,
    setShowInstructions,
    promptInstall,
  } = usePwaInstall();

  // Google Authentication state
  const [currentUser, setCurrentUser] = useState<{
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null>(() => {
    try {
      const cached = localStorage.getItem('nobs_auth_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Access status state
  const [accessStatus, setAccessStatus] = useState<'loading' | 'approved' | 'pending' | 'rejected'>('loading');
  const [requestRecord, setRequestRecord] = useState<AccessRequestRecord | undefined>(undefined);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [urlApprovalNotice, setUrlApprovalNotice] = useState<string | null>(null);
  const [inactivityNotice, setInactivityNotice] = useState(false);

  const isAdmin = checkIsAdmin(currentUser?.email);

  // Handle one-click URL approval action from John Joebert Suarez's Gmail
  useEffect(() => {
    handleUrlApprovalAction().then((res) => {
      if (res.handled) {
        if (res.action === 'approved') {
          setUrlApprovalNotice(
            `Access successfully granted for ${res.email}! The account is now authorized to use and install NoBSFeasibility.`
          );
        } else if (res.action === 'rejected') {
          setUrlApprovalNotice(`Access rejected for ${res.email}.`);
        } else if (res.error) {
          setUrlApprovalNotice(`Notice: ${res.error}`);
        }
      }
    });
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userObj = {
          displayName: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setCurrentUser(userObj);
        try {
          localStorage.setItem('nobs_auth_user', JSON.stringify(userObj));
        } catch {
          // ignore
        }
      } else {
        const cached = localStorage.getItem('nobs_auth_user');
        if (!cached) {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Verify access authorization for logged-in user
  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setAccessStatus('loading');
      return;
    }

    // Owner/Admin has permanent instant access
    if (checkIsAdmin(currentUser.email)) {
      setAccessStatus('approved');
      return;
    }

    let isMounted = true;
    checkAccessStatus(currentUser.email).then(async (result) => {
      if (!isMounted) return;

      if (result.status === 'approved') {
        setAccessStatus('approved');
        setRequestRecord(result.record);
      } else if (result.status === 'pending' || result.status === 'rejected') {
        setAccessStatus(result.status);
        setRequestRecord(result.record);
      } else {
        // Not requested yet: create request and dispatch email notification to suarezjohnjoebertcpa@gmail.com
        try {
          const rec = await requestWebsiteAccess({
            email: currentUser.email!,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          });
          if (!isMounted) return;
          setRequestRecord(rec);
          setAccessStatus('pending');
        } catch (err) {
          console.error('Failed to submit access request:', err);
          if (isMounted) setAccessStatus('pending');
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await logOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setCurrentUser(null);
    setAccessStatus('loading');
    try {
      localStorage.removeItem('nobs_auth_user');
    } catch {
      // ignore
    }
  }, []);

  // 3-hour inactivity auto-logout:
  // Automatically logs out user after 3 hours without activity and shows prompt to re-enter
  const handleInactivityLogout = useCallback(() => {
    handleSignOut();
    setInactivityNotice(true);
  }, [handleSignOut]);

  useInactivityTimeout({
    enabled: !!currentUser && accessStatus === 'approved',
    timeoutMs: 3 * 60 * 60 * 1000,
    onTimeout: handleInactivityLogout,
  });

  const handleLoginSuccess = (user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  }) => {
    setInactivityNotice(false);
    setCurrentUser(user);
    try {
      localStorage.setItem('nobs_auth_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [project]);

  // Reactive financial calculations
  const financials = useMemo(() => {
    return calculate5YearFinancials(project);
  }, [project]);

  const metrics = useMemo(() => {
    return calculateFeasibilityMetrics(project, financials);
  }, [project, financials]);

  // If loading auth state initially
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-sm font-bold text-slate-200">NoBSFeasibility</div>
        <div className="text-xs text-slate-400 mt-1">Verifying Google Authentication...</div>
      </div>
    );
  }

  // 1. If user is not authenticated: Gate with Google Login Screen
  if (!currentUser) {
    return (
      <LoginPage
        onSuccessLogin={handleLoginSuccess}
        inactivityNotice={inactivityNotice}
      />
    );
  }

  // 2. If user is signed in but pending or rejected by John Joebert Suarez:
  if (accessStatus === 'pending' || accessStatus === 'rejected') {
    return (
      <AccessPendingScreen
        user={{
          email: currentUser.email || '',
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        }}
        requestRecord={requestRecord}
        onApproved={() => setAccessStatus('approved')}
        onSignOut={handleSignOut}
      />
    );
  }

  // 3. If verifying access status for a signed-in user
  if (accessStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-sm font-bold text-slate-200">NoBSFeasibility</div>
        <div className="text-xs text-slate-400 mt-1">Verifying account permissions with administrator...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 pb-20 md:pb-0">
      {/* URL Approval Notification Banner */}
      {urlApprovalNotice && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{urlApprovalNotice}</span>
          </div>
          <button
            onClick={() => setUrlApprovalNotice(null)}
            className="text-emerald-300 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        project={project}
        onUpdateProject={setProject}
        financials={financials}
        metrics={metrics}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
        onOpenBankModal={() => setIsBankModalOpen(true)}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        onOpenInstallModal={() => setShowInstructions(true)}
        isInstalled={isInstalled}
        isAdmin={isAdmin}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Project Header Info & Assumptions Quick Bar */}
        <ProjectInfoCard
          project={project}
          onUpdateProject={setProject}
          metrics={metrics}
          financials={financials}
          onOpenBankModal={() => setIsBankModalOpen(true)}
          onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        />

        {/* Mobile View Switcher Dropdown (< md screens) */}
        <div className="md:hidden no-print mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <select
              aria-label="Select section view"
              value={activeMainView}
              onChange={(e) => setActiveMainView(e.target.value as MainViewType)}
              className="w-full bg-white border border-slate-300 text-slate-900 font-semibold text-xs rounded-xl py-2.5 pl-3 pr-8 shadow-xs appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
            >
              {NAV_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsBankModalOpen(true)}
            title="Breakdown of bank savings interest and loan amortization"
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs shrink-0 min-h-[42px]"
          >
            <Landmark className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden xs:inline">Bank & Loan</span>
            <span className="xs:hidden">Bank</span>
          </button>
        </div>

        {/* Navigation Section Tabs (Hidden on Print) */}
        <div className="no-print flex overflow-x-auto gap-1.5 sm:gap-2 mb-4 sm:mb-6 pb-1 border-b border-slate-200 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeMainView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMainView(item.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shadow-2xs min-h-[40px] sm:min-h-[42px] cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.shortLabel}</span>
                </span>
              </button>
            );
          })}

          {/* Dedicated Quick-Access Button for Bank Savings Interest & Loan Debt Breakdown */}
          <button
            onClick={() => setIsBankModalOpen(true)}
            title="Breakdown of interest received for bank savings and loan capital/interest to pay"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap shadow-2xs bg-gradient-to-r from-emerald-50 via-indigo-50 to-indigo-100 hover:from-emerald-100 hover:to-indigo-200 text-indigo-950 border border-indigo-200/90 cursor-pointer ml-auto min-h-[40px] sm:min-h-[42px] shrink-0"
          >
            <Landmark className="w-4 h-4 text-indigo-700 shrink-0" />
            <span className="hidden sm:inline">Bank Interest & Loan Breakdown</span>
            <span className="sm:hidden">Bank & Loan</span>
          </button>
        </div>

        {/* Print Only Thesis Document Header */}
        <div className="print-only hidden mb-8 text-center pb-4 border-b border-black">
          <h1 className="text-xl font-bold font-serif-title uppercase">{project.title}</h1>
          <p className="text-xs font-semibold">{project.academicProgram} - {project.institution}</p>
          <p className="text-xs italic">{project.proponents} ({project.academicYear})</p>
          <p className="text-[10px] text-slate-600 mt-1">CHAPTER V: FINANCIAL FEASIBILITY & PROJECTED FINANCIAL STATEMENTS</p>
        </div>

        {/* Primary Views */}
        {activeMainView === 'statements' && (
          <FinancialStatementsView
            project={project}
            financials={financials}
            onOpenBankModal={() => setIsBankModalOpen(true)}
            onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
          />
        )}

        {activeMainView === 'evaluation' && (
          <FeasibilityEvaluationView
            project={project}
            financials={financials}
            metrics={metrics}
          />
        )}

        {activeMainView === 'assumptions' && (
          <AssumptionsEditor
            project={project}
            onUpdateProject={setProject}
            onOpenBankModal={() => setIsBankModalOpen(true)}
          />
        )}

        {activeMainView === 'schedules' && (
          <SupportingSchedulesView
            project={project}
            financials={financials}
            onOpenBankModal={() => setIsBankModalOpen(true)}
          />
        )}

        {activeMainView === 'notes' && (
          <NotesAndDefenseNotes
            project={project}
            onUpdateProject={setProject}
            metrics={metrics}
            financials={financials}
          />
        )}

        {/* When Printing: Also display the other core parts sequentially for the complete academic chapter! */}
        <div className="print-only hidden space-y-8">
          <FeasibilityEvaluationView
            project={project}
            financials={financials}
            metrics={metrics}
          />
          <SupportingSchedulesView project={project} financials={financials} />
          <NotesAndDefenseNotes
            project={project}
            onUpdateProject={setProject}
            metrics={metrics}
            financials={financials}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 text-xs text-slate-500 py-4 px-4 sm:px-6 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Financial Statements Generator
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setIsCloudflareModalOpen(true)}
              className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" /> Publish on Cloudflare
            </button>
            <span>•</span>
            <span>CPA-Standard Accounting Conventions</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Quick Navigation Bar (< md screens) */}
      <nav aria-label="Mobile navigation" className="md:hidden no-print fixed bottom-2.5 left-2.5 right-2.5 z-30 pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/90 p-1.5 flex items-center justify-between gap-1 max-w-md w-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeMainView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMainView(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate max-w-[54px]">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Cloudflare Deploy Modal */}
      {isCloudflareModalOpen && (
        <CloudflareDeployModal
          isOpen={isCloudflareModalOpen}
          onClose={() => setIsCloudflareModalOpen(false)}
        />
      )}

      {/* Bank Savings Interest & Loan Debt Breakdown Modal */}
      {isBankModalOpen && (
        <BankInterestAndLoanModal
          isOpen={isBankModalOpen}
          onClose={() => setIsBankModalOpen(false)}
          project={project}
          onUpdateProject={setProject}
          financials={financials}
        />
      )}

      {/* Company Account Setup Modal */}
      {isCompanyModalOpen && (
        <CompanyAccountModal
          isOpen={isCompanyModalOpen}
          onClose={() => setIsCompanyModalOpen(false)}
          project={project}
          onUpdateProject={setProject}
        />
      )}

      {/* PWA Install Instructions & Direct Prompt Modal */}
      <InstallAppModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        onInstallDirectly={promptInstall}
        isIOS={isIOS}
      />

      {/* Admin User Access Control Modal for John Joebert Suarez */}
      {isAdmin && (
        <AdminAccessModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}
    </div>
  );
}
