'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  X,
  ChevronRight,
  Zap,
  WifiOff,
  Bell,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallModal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
      return Boolean(isStandaloneMode);
    };

    const standalone = checkStandalone();

    // Detect user platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);

    if (isIOSDevice) {
      setActivePlatform('ios');
    } else if (isAndroidDevice) {
      setActivePlatform('android');
    } else {
      setActivePlatform('desktop');
    }

    // Capture beforeinstallprompt event (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if user just signed up and needs PWA install prompt
    const justSignedUp = localStorage.getItem('oura_show_pwa_prompt');
    if (justSignedUp === 'true' && !standalone) {
      setIsNewUser(true);
      // Small timeout to allow smooth UI transition after signup
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Custom event to open install modal on-demand (e.g. from Settings or Header)
    const handleManualOpen = () => {
      setIsOpen(true);
      setIsNewUser(false);
    };

    window.addEventListener('oura_open_pwa_install', handleManualOpen);

    // App installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      localStorage.removeItem('oura_show_pwa_prompt');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('oura_open_pwa_install', handleManualOpen);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        localStorage.removeItem('oura_show_pwa_prompt');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('PWA install prompt error:', err);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oura_show_pwa_prompt');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 text-white animate-scaleUp relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-extrabold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isNewUser ? 'Welcome to OURA — Recommended Step' : 'Install OURA Application'}</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="p-2.5 rounded-2xl bg-linear-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center shrink-0">
              <img src="/logo.svg" alt="OURA Logo" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight bg-linear-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                Install OURA on Your Device
              </h2>
              <p className="text-xs text-slate-400">
                Fast offline access, home screen shortcut & full-screen experience
              </p>
            </div>
          </div>
        </div>

        {/* Quick Benefits Grid */}
        <div className="grid grid-cols-3 gap-2 text-center relative z-10">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
            <Zap className="w-4 h-4 text-amber-400 mx-auto" />
            <p className="text-[11px] font-extrabold text-white">Instant Load</p>
            <p className="text-[9px] text-slate-400">No browser lag</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
            <WifiOff className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-[11px] font-extrabold text-white">Offline Ready</p>
            <p className="text-[9px] text-slate-400">Works without data</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-1">
            <Bell className="w-4 h-4 text-indigo-400 mx-auto" />
            <p className="text-[11px] font-extrabold text-white">Shift Alarms</p>
            <p className="text-[9px] text-slate-400">Audio reminders</p>
          </div>
        </div>

        {/* 1-Click Install Button if Native Prompt Available */}
        {deferredPrompt && !isStandalone && (
          <div className="relative z-10">
            <button
              onClick={handleNativeInstall}
              className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>Install OURA App (1-Click Install)</span>
            </button>
          </div>
        )}

        {/* Success Banner if Installed */}
        {isStandalone && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-3 relative z-10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-extrabold text-white">App is Installed!</p>
              <p className="text-[11px] text-emerald-300/80">
                You are running OURA in standalone mode.
              </p>
            </div>
          </div>
        )}

        {/* Device Selection Tabs */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-300">Step-by-Step Installation Guide:</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Select Device</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActivePlatform('ios')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activePlatform === 'ios'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone/iPad</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('android')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activePlatform === 'android'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('desktop')}
              className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activePlatform === 'desktop'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Desktop/PC</span>
            </button>
          </div>

          {/* TAB 1: iOS (Safari) Step-by-Step Guide */}
          {activePlatform === 'ios' && (
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-700/50">
                <span className="text-xs font-black text-indigo-400">iOS Safari Installation</span>
                <span className="text-[10px] text-slate-400">(Apple Web App)</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-slate-200">
                      Open <span className="font-bold text-white">Safari</span> and tap the{' '}
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded-md border border-indigo-800">
                        <Share className="w-3 h-3" /> Share
                      </span>{' '}
                      button at the bottom or top bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-slate-200">
                      Scroll down in the share menu and tap{' '}
                      <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-700">
                        <PlusSquare className="w-3 h-3" /> Add to Home Screen
                      </span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-slate-200">
                      Tap <span className="font-bold text-white">Add</span> in the top right. OURA will now appear as an app icon on your Home Screen!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Android (Chrome / Edge / Samsung) Step-by-Step Guide */}
          {activePlatform === 'android' && (
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-700/50">
                <span className="text-xs font-black text-indigo-400">Android Chrome / Edge Installation</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {deferredPrompt ? (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-slate-200">
                        Click the <span className="font-bold text-indigo-300">"Install OURA App (1-Click)"</span> button at the top of this modal.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-slate-200">
                          In Google Chrome, tap the <span className="font-bold text-white">three dots menu (⋮)</span> in the top right corner.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-slate-200">
                          Tap <span className="font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-700">Install app</span> or <span className="font-bold text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-700">Add to Home screen</span>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="text-slate-200">
                          Confirm by tapping <span className="font-bold text-white">Install</span>. OURA will be placed in your app drawer & home screen!
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Desktop (Chrome / Edge / Mac) Step-by-Step Guide */}
          {activePlatform === 'desktop' && (
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-700/50">
                <span className="text-xs font-black text-indigo-400">Desktop (Windows / macOS / Linux)</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-slate-200">
                      Look at the right end of your browser's <span className="font-bold text-white">address/URL bar</span> for the <span className="font-bold text-indigo-300">Install OURA</span> icon (a monitor with a down arrow, or plus icon).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-slate-200">
                      Click <span className="font-bold text-amber-300">Install</span> on the popup dialog.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-slate-200">
                      OURA will launch as a standalone desktop window that you can pin to your taskbar or dock!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 relative z-10">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <span>{isNewUser ? 'Continue to Dashboard' : 'Close Guide'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
