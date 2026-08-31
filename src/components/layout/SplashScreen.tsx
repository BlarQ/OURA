'use client';

import React, { useEffect, useState } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Only show splash screen once per browser session
    const hasSeenSplash = sessionStorage.getItem('oura_splash_seen');
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1800);

    const timer2 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('oura_splash_seen', 'true');
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-slate-950 text-white flex flex-col items-center justify-center transition-opacity duration-600 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Glow Rings */}
      <div className="absolute w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

      {/* Main Logo & Text */}
      <div className="relative z-10 flex flex-col items-center space-y-4 animate-scaleUp">
        <div className="relative p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
          <img
            src="/logo.svg"
            alt="OURA"
            className="w-20 h-20 object-contain animate-bounce-subtle"
          />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold tracking-[0.2em] bg-linear-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            OURA
          </h1>
          <p className="text-xs font-bold text-indigo-400/90 tracking-widest uppercase">
            Personal Life Operating System
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
}
