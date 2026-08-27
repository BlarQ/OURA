'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, Sparkles, Heart, Shield, ArrowRight, Wallet, CalendarDays, HeartPulse, Utensils, Home, CheckCircle2, Bot, Smartphone, Share, PlusSquare, ChevronRight } from 'lucide-react';

export const LandingPage: React.FC<{ onLaunchApp: () => void }> = ({ onLaunchApp }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
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
    } else {
      // Fallback
      alert('To install OURA as a PWA, open your browser menu and select "Install App" or "Add to Home Screen".');
    }
  };

  const features = [
    {
      title: 'Shared Financial Planning',
      desc: 'Salary tracking, joint savings goals, and dual purchase confirmation with celebratory confetti.',
      icon: Wallet,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    {
      title: 'Duty Rotation Engine',
      desc: '6-day repeating shift rotation (2 Morning -> 2 Night -> 2 Off) with automatic Home Weekend detection.',
      icon: CalendarDays,
      color: 'bg-indigo-50 text-[#695be8] border-indigo-100'
    },
    {
      title: 'Menstrual Health & Privacy',
      desc: 'Predictive cycle calendar, symptom logger, and granular privacy controls (Level 1-5 sharing).',
      icon: HeartPulse,
      color: 'bg-rose-50 text-rose-600 border-rose-100'
    },
    {
      title: 'Apartment & Dream Home',
      desc: 'Equipment price tracking, workplace setup checklists, and long-term land & home savings.',
      icon: Home,
      color: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    {
      title: 'Nigerian Meal Planning',
      desc: 'Weekly nutritious meal plans tailored for shift workers and busy professional couples.',
      icon: Utensils,
      color: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    {
      title: 'OURA Intelligence AI',
      desc: 'Smart companion providing instant schedule lookups, expense summaries, and life advice.',
      icon: Bot,
      color: 'bg-sky-50 text-sky-600 border-sky-100'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-[#695be8] selection:text-white flex flex-col relative overflow-hidden">
      {/* Background Glowing Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#695be8]/30 via-indigo-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border border-white/20 p-1 bg-white/10 backdrop-blur-md flex items-center justify-center">
            <Image src="/logo.png" alt="OURA Logo" width={40} height={40} className="object-contain w-full h-full rounded-xl" priority />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest text-white">OURA</h1>
            <p className="text-[10px] text-indigo-200 font-semibold">Our Life, Our Home, Our Plans.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-2xl border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Install PWA</span>
          </button>

          <button
            onClick={onLaunchApp}
            className="flex items-center gap-1.5 bg-[#695be8] hover:bg-indigo-600 text-white font-extrabold text-xs px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 border border-indigo-400/30"
          >
            Launch Web App <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 pb-20 relative z-20 space-y-16 flex-1 text-center sm:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Dedicated Couple Productivity PWA
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Reduce the amount of life you keep in your heads.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium max-w-xl">
              An intelligent, private PWA built for engaged & married couples. Organize finances, household equipment, 6-day duty shifts, menstrual health, Nigerian meal plans, and dream home goals in one unified space.
            </p>

            {/* Action CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleInstallClick}
                className="py-4 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5 text-slate-950" /> Install OURA App on Device
              </button>

              <button
                onClick={onLaunchApp}
                className="py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Open Web App Directly <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Offline Capable PWA</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dual Confirmation Protection</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> End-to-End Privacy</span>
            </div>
          </div>

          {/* Right Column: Interactive Visual Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-900/90 rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl space-y-5 relative group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#695be8] p-1 flex items-center justify-center">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-lg" />
                  </div>
                  <span className="font-extrabold text-sm text-white">OURA App Preview</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  PWA Ready
                </span>
              </div>

              {/* Mock App Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Monthly Net Spend</span>
                  <span className="text-emerald-400 font-bold">₦98k below avg</span>
                </div>
                <h3 className="text-2xl font-black text-white">₦210,000 NGN</h3>
                <div className="h-14 w-full relative">
                  <svg className="w-full h-full text-[#695be8]" viewBox="0 0 200 50" fill="none">
                    <path d="M0 40 C 40 30, 80 45, 120 20 C 160 5, 180 25, 200 15 L 200 50 L 0 50 Z" fill="#695be8" fillOpacity="0.2" />
                    <path d="M0 40 C 40 30, 80 45, 120 20 C 160 5, 180 25, 200 15" stroke="#695be8" strokeWidth="3" />
                  </svg>
                </div>
              </div>

              <button
                onClick={onLaunchApp}
                className="w-full py-3 bg-[#695be8] hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                Sign In to Your Account <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Grid Showcase */}
        <div className="pt-12 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-white">Everything You Need for Your Life Together</h3>
            <p className="text-xs text-slate-400">Built specifically for Aisha & Tunde with seamless couple sync.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-900/80 p-6 rounded-[2rem] border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-3"
                >
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center border shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">{f.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* iOS Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl relative animate-fadeInScale space-y-4">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Share className="w-5 h-5 text-[#695be8]" /> Install OURA on iPhone / iPad
            </h3>
            <p className="text-xs text-slate-400">
              Follow these simple steps in Safari to add OURA directly to your Home Screen:
            </p>

            <ol className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <span className="bg-[#695be8] text-white w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-indigo-400" /> in Safari toolbar.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <span className="bg-[#695be8] text-white w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>Select <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-indigo-400" />.</span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <span className="bg-[#695be8] text-white w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span>Tap <strong>Add</strong> in the top right. Enjoy OURA offline!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-[#695be8] text-white font-bold text-xs rounded-xl hover:bg-indigo-600 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
