'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  ShieldCheck,
} from 'lucide-react';
import SecretCodeModal from '@/components/auth/SecretCodeModal';
import BrandLogo from '@/components/common/BrandLogo';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    // Check URL search params for email
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      setEmail(decodeURIComponent(paramEmail));
    }

    const authGate =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('mymanual_auth_gate')
        : null;

    if (
      authGate &&
      (authGate.startsWith('otp_authorized_') ||
        authGate.startsWith('1997_authorized_'))
    ) {
      setIsAuthorized(true);
      // Extract email from token if not already set
      if (!paramEmail && authGate.includes('@')) {
        const parts = authGate.split('_');
        const tokenEmail = parts[parts.length - 1];
        if (tokenEmail) setEmail(decodeURIComponent(tokenEmail));
      }
    } else {
      setShowGateModal(true);
    }
  }, [searchParams]);

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

      // Check if session is already active from OTP verification
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session?.user) {
        // Update password and metadata for the authenticated user
        const { error: updateError } = await supabase.auth.updateUser({
          password,
          data: {
            full_name: fullName.trim(),
          },
        });

        if (updateError) {
          setErrorMsg(updateError.message);
          setLoading(false);
          return;
        }

        sessionStorage.removeItem('mymanual_auth_gate');
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Standard signup flow
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
          'Administrator account created successfully! Please check your email to confirm your account.'
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
          onClose={() => {
            setShowGateModal(false);
            router.push('/login');
          }}
          onSuccess={() => {
            setIsAuthorized(true);
            setShowGateModal(false);
          }}
        />
        <div className="text-pewter text-xs flex items-center justify-center gap-1.5 font-bold">
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
            <span className="text-xl font-extrabold tracking-tight text-ink-black">
              AdeManual
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-3xl bg-sprout-green text-xs font-bold text-ink-black shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>OTP Security Verified</span>
          </div>

          <h1 className="text-2xl font-extrabold text-ink-black tracking-tight">
            Create Administrator Account
          </h1>
          <p className="text-xs text-pewter">
            Set up your standard IT procedure documentation profile
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-6 rounded-2xl bg-paper-white border border-ash-gray text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-sprout-green text-ink-black mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-ink-black">Registration Pending Confirmation</h3>
              <p className="text-xs text-pewter">{successMsg}</p>
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
              <label className="text-[13px] font-bold text-ink-black block">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="input-sprout w-full"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-ink-black block">
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
              <label className="text-[13px] font-bold text-ink-black block">
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-pewter hover:text-ink-black transition cursor-pointer"
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
              <label className="text-[13px] font-bold text-ink-black block">
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full text-center py-12 text-pewter text-xs flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading security verification...</span>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
