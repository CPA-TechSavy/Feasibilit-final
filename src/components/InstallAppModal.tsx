import React from 'react';
import { Download, Smartphone, Monitor, Share2, PlusSquare, CheckCircle, X, ArrowUpRight } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallDirectly?: () => void;
  isIOS?: boolean;
}

export default function InstallAppModal({
  isOpen,
  onClose,
  onInstallDirectly,
  isIOS,
}: InstallAppModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
            <img src="/icon.svg" alt="NoBSFeasibility" className="w-full h-full rounded-[10px]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Install NoBSFeasibility</h2>
            <p className="text-xs text-slate-500">
              Run as a standalone native app on your phone or computer
            </p>
          </div>
        </div>

        {/* Benefits Pill */}
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 mb-5 grid grid-cols-3 gap-2 text-center">
          <div className="text-xs">
            <span className="block font-bold text-indigo-950">⚡ Fast Access</span>
            <span className="text-[10px] text-indigo-700">Home screen icon</span>
          </div>
          <div className="text-xs border-x border-indigo-200/60 px-1">
            <span className="block font-bold text-indigo-950">📱 Full Screen</span>
            <span className="text-[10px] text-indigo-700">No browser address bar</span>
          </div>
          <div className="text-xs">
            <span className="block font-bold text-indigo-950">💾 Offline Ready</span>
            <span className="text-[10px] text-indigo-700">Cached application shell</span>
          </div>
        </div>

        {/* Instructions by device */}
        <div className="space-y-4 mb-6">
          {/* iOS Safari Instructions */}
          {isIOS ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2.5 font-bold text-slate-800 text-sm">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <span>On iPhone / iPad (Safari)</span>
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1">
                <li>
                  Tap the <span className="font-semibold text-slate-900 inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200"><Share2 className="w-3 h-3 text-blue-600 inline" /> Share</span> button at the bottom or top of Safari.
                </li>
                <li>
                  Scroll down the menu and tap <span className="font-semibold text-slate-900 inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200"><PlusSquare className="w-3 h-3 text-slate-700 inline" /> Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="font-semibold text-indigo-700">Add</span> in the top right corner. The app will appear on your phone screen!
                </li>
              </ol>
            </div>
          ) : (
            <>
              {/* Android Instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>On Android (Chrome / Edge / Samsung)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tap the <span className="font-semibold text-slate-800">three dots (⋮)</span> in the top-right corner of Chrome, then select <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">Install app</span> or <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">Add to Home Screen</span>.
                </p>
              </div>

              {/* Computer (Windows / Mac / Chromebook) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>On Computers (Windows / Mac / Chrome / Edge)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Click the <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1"><Download className="w-3 h-3 text-indigo-600" /> Install</span> icon located in your browser&apos;s address URL bar, or click the button below.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Got it
          </button>
          {onInstallDirectly && !isIOS && (
            <button
              type="button"
              onClick={() => {
                onInstallDirectly();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install to this Device Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
