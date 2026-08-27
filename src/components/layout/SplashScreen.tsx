'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export const SplashScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    const timer2 = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 300);
      }}
      className={`fixed inset-0 z-50 bg-gradient-to-br from-[#4f42db] via-[#695be8] to-[#8070f8] text-white flex flex-col items-center justify-center p-6 cursor-pointer transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Particles */}
      <div className="absolute w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Main Logo & Animated Text Box */}
      <div className="flex flex-col items-center text-center space-y-4 z-10 animate-fadeInScale">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/30 p-2 bg-white/10 backdrop-blur-md animate-bounce">
          <Image
            src="/logo.png"
            alt="OURA Logo"
            width={128}
            height={128}
            className="object-contain w-full h-full rounded-2xl"
            priority
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-widest text-white drop-shadow-lg">
            OURA
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 font-semibold tracking-wide">
            Our Life, Our Home, Our Plans.
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-36 h-1.5 bg-white/20 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-amber-400 rounded-full animate-pulse font-mono w-full transition-all duration-1000" />
        </div>
      </div>
    </div>
  );
};
