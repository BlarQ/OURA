'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import SecretCodeModal from '@/components/auth/SecretCodeModal';
import InteractiveAvatar from '@/components/auth/InteractiveAvatar';
import BrandLogo from '@/components/common/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);

  // Avatar interactivity state
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      if (data?.session) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        setErrorMsg('Unable to connect to Supabase. Please check your network connection.');
      } else {
        setErrorMsg(err?.message || 'An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <SecretCodeModal
        isOpen={showSecretModal}
        onClose={() => setShowSecretModal(false)}
        redirectTo="/signup"
      />

      {/* Main Flat Card (16px radius, 1px ash-gray border, 0 drop shadow) */}
      <div className="card-sprout p-7 sm:p-9 space-y-6">
        {/* Brand Logo & Interactive Avatar */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="lg" />
            <span className="text-2xl font-extrabold tracking-tight text-[#040404]">
              AdeManual
            </span>
          </div>

          <div className="pt-2">
            <InteractiveAvatar
              isPasswordFocused={isPasswordFocused && !showPassword}
              isTypingEmail={isEmailFocused}
            />
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-[28px] font-extrabold text-[#040404] tracking-tight leading-tight">
              Sign in to your workspace
            </h1>
            <p className="text-sm text-[#6e797a]">
              IT Operating Procedures & Standard Execution Playbooks
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-[6px] bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#040404] block">
              Work Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="name@company.com"
                className="input-sprout w-full"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#040404]">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="••••••••"
                className="input-sprout w-full pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6e797a] hover:text-[#040404] transition cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Primary CTA (Sprout Green) */}
          <button
            type="submit"
            disabled={loading}
            className="btn-sprout-primary w-full mt-2 h-12"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Discreet Security Footer */}
      <div className="flex items-center justify-between px-2 text-[13px] text-[#6e797a]">
        <span>Protected IT Workspace</span>

        {/* 1997 Provisioning Trigger */}
        <button
          type="button"
          onClick={() => setShowSecretModal(true)}
          title="Administrative Provisioning"
          className="link-sprout text-[13px] text-[#040404] cursor-pointer"
        >
          Admin Registration
        </button>
      </div>
    </div>
  );
}
