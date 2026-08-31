'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, ArrowRight, Calendar, Wallet, FileText, Sparkles, Smartphone, X } from 'lucide-react';
import { authService } from '@/lib/services/auth';
import { showToast } from '@/components/layout/ConfirmModal';

export function LandingView() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isStandalonePWA, setIsStandalonePWA] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const user = await authService.getCurrentUser();
      if (user && user.email) {
        setIsLoggedIn(true);
      }
    }
    checkAuth();

    // Detect if running inside installed PWA standalone window
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isPWA) {
      setIsStandalonePWA(true);
      setShowInstallBanner(false);
    }

    // Listen for browser PWA Install Prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('OURA PWA Installed Successfully! Check your home screen.', 'success');
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      showToast('To install OURA: Tap your browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App".', 'info');
      setShowInstallBanner(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NON-BLOCKING PWA INSTALL BANNER NOTIFICATION */}
      {showInstallBanner && !isStandalonePWA && (
        <div className="w-full bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/40 px-4 py-2.5 sm:px-8 text-white relative z-50 animate-fadeIn shadow-lg">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="OURA" className="w-6 h-6 shrink-0 object-contain" />
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-black uppercase tracking-wider">PWA APP AVAILABLE</span>
                <span className="text-xs font-bold text-slate-200">
                  Install OURA on your device for instant offline access!
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss Notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="OURA Logo" className="w-9 h-9 object-contain" />
          <span className="font-[family-name:var(--font-syne)] font-extrabold text-xl tracking-wider text-white">
            OURA
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isStandalonePWA && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-extrabold transition-all active:scale-95 shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Install PWA App</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          <Link
            href={isLoggedIn ? "/today" : "/login"}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <span>{isLoggedIn ? "Go to Workspace" : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-20 space-y-16 relative z-10 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-6 max-w-3xl mx-auto animate-scaleUp">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Official Progressive Web Application (PWA)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight bg-linear-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Your Personal Life, Work Roster & Salary Management OS
          </h1>

          <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Install OURA directly to your home screen for instantaneous offline-ready access to your work shifts, financial ledger, task management, and life planning.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Smartphone className="w-5 h-5" />
              <span>Install PWA App on Device</span>
            </button>

            <Link
              href={isLoggedIn ? "/today" : "/login"}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>{isLoggedIn ? "Open Web Workspace" : "Access Login Screen"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-indigo-500/50 transition-colors">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">Work Shift Roster Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-generate annual work rosters with instant shift templates (Morning, Night, Rest Days, Remote).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-indigo-500/50 transition-colors">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">Salary & Safe Balance Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time ledger tracking credits, debits, minimum safe balance alerts, and "Can I Afford This?" calculator.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-indigo-500/50 transition-colors">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">Mobile Notepad & Sharing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Draft personal notes, pin important messages, export as TXT/PDF, or share directly to WhatsApp and SMS.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} OURA Personal Operating System. Built with Next.js 16 PWA.</p>
      </footer>
    </div>
  );
}
