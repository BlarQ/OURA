'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useOura } from '../../context/OuraContext';
import { User, Mail, Lock, CheckCircle2, QrCode, ArrowRight, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Role } from '../../lib/types';
import { signUpUserWithSupabase, signInUserWithSupabase } from '../../lib/supabaseAuth';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { loginWithProfile } = useOura();

  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedGenderRole, setSelectedGenderRole] = useState<Role>('husband');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectionSuccessMsg, setConnectionSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    const result = await signUpUserWithSupabase(
      email,
      password,
      fullName,
      selectedGenderRole,
      inviteCodeInput
    );

    setIsLoading(false);

    if (result.success && result.profile) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setConnectionSuccessMsg(`✨ Account created for ${fullName}! Logging in...`);
      setTimeout(() => {
        loginWithProfile(result.profile!);
        onClose();
      }, 1000);
    } else {
      setErrorMsg(result.error || 'Registration failed');
    }
  };

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    const result = await signInUserWithSupabase(email, password, selectedGenderRole);

    setIsLoading(false);

    if (result.success && result.profile) {
      setConnectionSuccessMsg(`Welcome back, ${result.profile.name}!`);
      setTimeout(() => {
        loginWithProfile(result.profile!);
        onClose();
      }, 1000);
    } else {
      setErrorMsg(result.error || 'Invalid email or password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-[2.25rem] p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-fadeInScale space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl mx-auto overflow-hidden shadow-md border border-slate-100 p-1 bg-white flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="OURA Logo"
              width={48}
              height={48}
              className="object-contain w-full h-full rounded-xl"
            />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">OURA</h2>
          <p className="text-xs text-slate-500">Sign in or create your couple account</p>
        </div>

        {/* Sign Up / Log In Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => {
              setAuthTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              authTab === 'signup' ? 'bg-[#695be8] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => {
              setAuthTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              authTab === 'login' ? 'bg-[#695be8] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Log In
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeInScale">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {connectionSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeInScale">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{connectionSuccessMsg}</span>
          </div>
        )}

        {authTab === 'signup' ? (
          <form onSubmit={handleSignUp} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Alex & Jordan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="e.g. couple@oura.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                  required
                />
              </div>
            </div>

            {/* PASSWORD INPUT FIELD WITH SHOW/HIDE TOGGLE */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 p-0.5 transition-all"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-[#695be8]" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* MINIMIZED & SMART GENDER / ROLE SELECTOR */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Gender / Role</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGenderRole('wife')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                    selectedGenderRole === 'wife'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>👩🏾‍⚕️</span> Female (Wife)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGenderRole('husband')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                    selectedGenderRole === 'husband'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>👨🏾‍💼</span> Male (Husband)
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Partner Invitation Code <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. OURA-7782-99"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:outline-[#695be8]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#695be8] text-white font-extrabold text-xs rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogIn} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="e.g. couple@oura.app"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 p-0.5 transition-all"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-[#695be8]" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#695be8] text-white font-extrabold text-xs rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In to Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
