'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(ios);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  if (dismissed) return null;

  return (
    <>
      {/* Top Banner */}
      <div className="bg-slate-900 text-white text-xs px-4 py-2 flex items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Install <strong>OURA</strong> on your mobile or desktop home screen for offline access & alerts.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-full shadow transition-all active:scale-95 text-[11px]"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-base font-bold flex items-center gap-2 text-slate-900">
              <Share className="w-5 h-5 text-indigo-600" /> Install OURA on iPhone / iPad
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Follow these simple steps in Safari to add OURA directly to your Home Screen:
            </p>

            <ol className="mt-4 space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5 bg-indigo-50 p-2.5 rounded-2xl border border-indigo-100">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>Tap the <strong>Share</strong> icon <Share className="w-3.5 h-3.5 inline text-indigo-600" /> in Safari's bottom toolbar.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-indigo-50 p-2.5 rounded-2xl border border-indigo-100">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>Scroll down and select <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-indigo-600" />.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-indigo-50 p-2.5 rounded-2xl border border-indigo-100">
                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span>Tap <strong>Add</strong> in the top right. Done!</span>
              </li>
            </ol>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowIosGuide(false)}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
