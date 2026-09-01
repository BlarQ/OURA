'use client';

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Smooth progress loading bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 15;
      });
    }, 150);

    const fadeTimer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
    }, 1300);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 1800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-99999 bg-slate-950 text-white flex flex-col items-center justify-center transition-all duration-700 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Background Glow Rings */}
      <div className="absolute w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }} />

      {/* Main Logo & Branding */}
      <div className="relative z-10 flex flex-col items-center space-y-5 animate-scaleUp">
        <div className="relative p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl shadow-indigo-500/25">
          <img
            src="/icon.png"
            alt="OURA"
            className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-bounce-subtle"
            onError={(e) => {
              // Fallback to logo.svg if icon.png issue occurs
              (e.target as HTMLImageElement).src = '/logo.svg';
            }}
          />
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-[0.25em] bg-linear-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            OURA
          </h1>
          <p className="text-xs font-bold text-indigo-300/90 tracking-widest uppercase">
            Personal Life Operating System
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-44 h-1.5 bg-slate-800/90 rounded-full overflow-hidden mt-4 p-0.5 border border-slate-700/50">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
