'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import SecretCodeModal from '@/components/auth/SecretCodeModal';
import BrandLogo from '@/components/common/BrandLogo';

export default function SignupPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const authGate =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('mymanual_auth_gate')
        : null;
    if (authGate && authGate.startsWith('1997_authorized_')) {
      setIsAuthorized(true);
    } else {
      setShowGateModal(true);
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        sessionStorage.removeItem('mymanual_auth_gate');
        router.push('/dashboard');
        router.refresh();
      } else {
        sessionStorage.removeItem('mymanual_auth_gate');
        setSuccessMsg(
          'Account created! Please check your email to confirm your account.'
        );
      }
    } catch (err: any) {
      if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
        setErrorMsg('Unable to connect to Supabase. Please check your network connection.');
      } else {
        setErrorMsg(err?.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="w-full text-center py-12 space-y-4">
        <SecretCodeModal
          isOpen={showGateModal}
          onClose={() => setShowGateModal(false)}
          onSuccess={() => {
            setIsAuthorized(true);
            setShowGateModal(false);
          }}
        />
        <div className="text-[#6e797a] text-xs flex items-center justify-center gap-1.5 font-bold">
          <Lock className="h-3.5 w-3.5" />
          <span>Verifying security authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="card-sprout p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5 pb-1">
            <BrandLogo size="md" />
            <span className="text-xl font-extrabold tracking-tight text-[#040404]">
              AdeManual
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[24px] bg-[#98e58e] text-xs font-bold text-[#040404]">
            Authorized Registration (1997)
          </div>

          <h1 className="text-2xl font-extrabold text-[#040404] tracking-tight">
            Create Administrator Account
          </h1>
          <p className="text-xs text-[#6e797a]">
            Set up your standard IT procedure documentation profile
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-[6px] bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-6 rounded-[16px] bg-[#ffffff] border border-[#d9d9d9] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#98e58e] text-[#040404] mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#040404]">Registration Pending Confirmation</h3>
              <p className="text-xs text-[#6e797a]">{successMsg}</p>
            </div>
            <Link
              href="/login"
              className="btn-sprout-primary w-full"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#040404] block">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="input-sprout w-full"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#040404] block">
                Work Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="input-sprout w-full"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#040404] block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#040404] block">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="input-sprout w-full"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-sprout-primary w-full mt-2 h-12"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs">
        <Link
          href="/login"
          className="link-sprout"
        >
          ← Return to Sign In
        </Link>
      </div>
    </div>
  );
}
