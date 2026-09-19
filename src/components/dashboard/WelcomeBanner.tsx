'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  Activity,
  Layers,
  X,
  Terminal,
} from 'lucide-react';

interface WelcomeBannerProps {
  userName: string;
  manualsCount: number;
}

export default function WelcomeBanner({ userName, manualsCount }: WelcomeBannerProps) {
  const [greeting, setGreeting] = useState('Welcome back');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  if (!isVisible) return null;

  return (
    <div className="relative hero-reversed-panel p-5 sm:p-7 space-y-4 sm:space-y-5 animate-modal-in shadow-xl overflow-hidden">
      {/* Subtle decorative background glow */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-sprout-green/10 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 p-1.5 text-pewter hover:text-paper-white rounded-md hover:bg-white/10 transition cursor-pointer active:scale-90"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 relative z-10">
        <div className="space-y-2.5 max-w-xl pr-6 sm:pr-0">
          {/* Badge: Single line guaranteed on mobile and desktop */}
          <div className="badge-sprout-green text-[10px] sm:text-xs py-0.5 px-2.5 whitespace-nowrap inline-flex items-center gap-1.5 max-w-full">
            <Terminal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-ink-black shrink-0" />
            <span className="sm:hidden">Active • PostgreSQL RLS</span>
            <span className="hidden sm:inline">Workspace Active • PostgreSQL RLS Security</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-paper-white tracking-tight leading-snug wrap-break-word">
            {greeting}, {userName}
          </h2>

          <p className="text-xs sm:text-sm text-smoke-gray leading-relaxed">
            Centralized IT Standard Operating Procedures. Document sequential playbooks, attach mobile camera captures, and run procedural walkthroughs.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 text-xs text-paper-white">
            <span className="badge-sprout-neutral bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors whitespace-nowrap text-[10px] sm:text-xs py-0.5 px-2 sm:px-2.5">
              <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sprout-green" />
              <span>{manualsCount} {manualsCount === 1 ? 'Procedure' : 'Procedures'}</span>
            </span>
            <span className="badge-sprout-neutral bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors whitespace-nowrap text-[10px] sm:text-xs py-0.5 px-2 sm:px-2.5">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sprout-green" />
              <span>Row-Level Security</span>
            </span>
            <span className="badge-sprout-neutral bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors whitespace-nowrap text-[10px] sm:text-xs py-0.5 px-2 sm:px-2.5">
              <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sprout-green" />
              <span>Supabase Storage</span>
            </span>
          </div>
        </div>

        {/* Primary CTA Button (Sprout Green) */}
        <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
          <Link
            href="/manuals/new"
            className="btn-sprout-primary text-xs sm:text-sm w-full sm:w-auto text-center"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
            <span>Create New Manual</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
