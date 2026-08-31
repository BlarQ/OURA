'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, User, Mail, Lock, DollarSign, Wallet, Calendar, Sparkles,
  ChevronRight, ChevronLeft, CheckCircle2, Building, Laptop, Compass, Heart
} from 'lucide-react';
import { CurrencyCode } from '@/types';
import { authService, OnboardingData } from '@/lib/services/auth';
import { showToast } from '@/components/layout/ConfirmModal';

export function SignupView() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Financial setup
  const [currency, setCurrency] = useState<CurrencyCode>('NGN');
  const [monthlySalary, setMonthlySalary] = useState<number>(450000);
  const [minimumSafeBalance, setMinimumSafeBalance] = useState<number>(50000);

  // Work Roster setup
  const [occupation, setOccupation] = useState<string>('');
  const [rosterPreference, setRosterPreference] = useState<string>('SAPPHIRE');

  // Goals Focus Area setup
  const [focusGoals, setFocusGoals] = useState<string[]>(['Financial Freedom', 'Work Roster Tracking']);

  const toggleGoal = (goal: string) => {
    if (focusGoals.includes(goal)) {
      setFocusGoals(focusGoals.filter((g) => g !== goal));
    } else {
      setFocusGoals([...focusGoals, goal]);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!fullName || !email || !password) {
        showToast('Please fill in all account fields', 'error');
        return;
      }
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCompleteSignup = async () => {
    setIsLoading(true);
    const onboarding: OnboardingData = {
      full_name: fullName,
      email,
      currency,
      monthly_salary: monthlySalary,
      minimum_safe_balance: minimumSafeBalance,
      occupation,
      roster_preference: rosterPreference,
      focus_goals: focusGoals,
    };

    const res = await authService.signUp(email, password, onboarding);
    setIsLoading(false);

    if (res) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('oura_show_app_tour', 'true');
      }
      showToast('Account setup completed! Welcome to OURA.', 'success');
      router.push('/today');
    } else {
      showToast('Failed to complete signup', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 animate-scaleUp">
        {/* Header & Step Indicator Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                OURA Onboarding
              </h1>
            </div>
            <span className="text-xs font-extrabold text-indigo-400 bg-indigo-950 px-3 py-1 rounded-xl border border-indigo-800">
              Step {currentStep} of 4
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: ACCOUNT DETAILS */}
        {currentStep === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Create Your Account</h2>
              <p className="text-xs text-slate-400">Enter your name and login credentials</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Password *</label>
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

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Next: Financial Setup</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: FINANCIAL SETUP */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Financial & Salary Setup</h2>
              <p className="text-xs text-slate-400">Configure your primary currency, salary, and minimum balance alert</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Primary Currency</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: 'NGN', symbol: '₦' },
                  { code: 'USD', symbol: '$' },
                  { code: 'EUR', symbol: '€' },
                  { code: 'GBP', symbol: '£' },
                ].map((cur) => (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => setCurrency(cur.code as CurrencyCode)}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                      currency === cur.code
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {cur.symbol} {cur.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Monthly Base Income</label>
                <input
                  type="number"
                  required
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Min Safe Balance Alert</label>
                <input
                  type="number"
                  required
                  value={minimumSafeBalance}
                  onChange={(e) => setMinimumSafeBalance(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <span>Next: Work & Shift Preferences</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: WORK & ROSTER PREFERENCES */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Work Shift Roster Preference</h2>
              <p className="text-xs text-slate-400">Choose your default work pattern for automated calendar scheduling</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Primary Role / Occupation</label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Nurse, Client Specialist"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Preferred Work Schedule Template</label>
              {[
                {
                  id: 'SAPPHIRE',
                  title: '💎 Sapphire Schedule',
                  desc: '2 Morning Shifts → 2 Night Shifts → 2 Off Days (6-Day Rotation)',
                },
                {
                  id: 'FLEXI_REMOTE',
                  title: '💻 Flexi-Remote Hybrid',
                  desc: 'Select remote days & off days with automatic calendar generation',
                },
                {
                  id: 'STANDARD',
                  title: '🏢 Standard 9-to-5 Work Week',
                  desc: 'Monday through Friday work hours with weekend rest',
                },
              ].map((template) => (
                <div
                  key={template.id}
                  onClick={() => setRosterPreference(template.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-0.5 ${
                    rosterPreference === template.id
                      ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <h4 className="text-xs font-extrabold text-white">{template.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{template.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <span>Next: Personal Focus Goals</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: GOALS & FINISH */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Personal Focus Goals</h2>
              <p className="text-xs text-slate-400">Select what you want OURA to help you manage and achieve</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                'Financial Freedom',
                'Work Roster Tracking',
                'Apartment Setup Plan',
                'Savings Target',
                'Daily Habits & Activities',
                'Monthly Salary Ledger',
              ].map((goal) => {
                const isSelected = focusGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`p-3 rounded-2xl text-xs font-extrabold text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{goal}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleCompleteSignup}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isLoading ? 'Setting Up Workspace...' : 'Complete Setup & Launch OURA'}</span>
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pt-2">
          Already have an account?{' '}
          <Link href="/login" className="font-extrabold text-indigo-400 hover:text-indigo-300 underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}
