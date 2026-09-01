'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { authService } from '@/lib/services/auth';
import { showToast } from '@/components/layout/ConfirmModal';

export function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    async function checkExistingAuth() {
      const user = await authService.getCurrentUser();
      if (user && user.email) {
        router.push('/today');
      }
    }
    checkExistingAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const success = await authService.signIn(email, password);
    setIsLoading(false);

    if (success) {
      showToast('Welcome back to OURA!', 'success');
      router.push('/today');
    } else {
      showToast('Invalid login credentials', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10 animate-scaleUp">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <Link href="/login" className="inline-block group">
            <div className="p-3.5 rounded-3xl bg-indigo-600/15 border border-indigo-500/30 shadow-xl mx-auto mb-3 w-16 h-16 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <img
                src="/logo.svg"
                alt="OURA"
                className="w-10 h-10 object-contain"
              />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight bg-linear-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Welcome to OURA
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Your Personal Life, Work Roster & Salary Management OS
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-slate-800/80 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="font-extrabold text-indigo-400 hover:text-indigo-300 underline">
              Create New Account & Set Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
