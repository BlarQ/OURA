'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';

interface SecretCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function SecretCodeModal({
  isOpen,
  onClose,
  onSuccess,
  redirectTo = '/signup',
}: SecretCodeModalProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('c••••••••••••a@gmail.com');

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock HTML and Body scroll completely when modal is open
  useModalScrollLock(isOpen, onClose);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Dispatch OTP to Master Admin email when modal opens
  const dispatchOtp = useCallback(async () => {
    setIsDispatching(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to dispatch security OTP.');
      } else {
        if (data.maskedEmail) setMaskedEmail(data.maskedEmail);
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg('Network error while requesting OTP.');
    } finally {
      setIsDispatching(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg(null);
      setSuccess(false);
      setIsSubmitting(false);
      dispatchOtp();
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 200);
    }
  }, [isOpen, dispatchOtp]);

  if (!isOpen || !mounted) return null;

  // VERIFY OTP
  const handleVerifyOtp = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          code: codeToVerify,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid or expired OTP code.');
        setIsSubmitting(false);
        return;
      }

      // Success!
      setSuccess(true);
      setErrorMsg(null);
      setIsSubmitting(false);

      if (typeof window !== 'undefined') {
        const authToken =
          data.token ||
          `otp_authorized_${Date.now()}_${encodeURIComponent(data.email || 'Collinsogunlala@gmail.com')}`;
        sessionStorage.setItem('mymanual_auth_gate', authToken);
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(redirectTo);
        }
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg('Network error during verification. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    if (errorMsg) setErrorMsg(null);

    if (cleaned && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split('');
      setDigits(arr);
      handleVerifyOtp(pasted);
    } else if (pasted.length > 0) {
      const arr = [...digits];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        arr[i] = pasted[i];
      }
      setDigits(arr);
      if (pasted.length < 6) {
        inputRefs[pasted.length].current?.focus();
      }
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-99999 w-screen h-screen min-h-dvh flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md my-auto bg-paper-white border border-ash-gray rounded-2xl p-6 sm:p-8 space-y-6 text-ink-black max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar animate-modal-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-pewter hover:text-ink-black rounded-md hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div
            className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center transition-all ${
              errorMsg
                ? 'bg-red-100 text-red-700 border border-red-300'
                : success
                ? 'bg-sprout-green text-ink-black'
                : 'bg-ink-black text-paper-white'
            }`}
          >
            {errorMsg ? (
              <ShieldAlert className="h-6 w-6" />
            ) : success ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : isDispatching ? (
              <Loader2 className="h-6 w-6 animate-spin text-paper-white" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-ink-black tracking-tight">
              {success
                ? 'Access Granted'
                : isDispatching
                ? 'Dispatching Master OTP...'
                : 'Master Admin Authorization'}
            </h3>
            <p className="text-xs text-pewter max-w-xs mx-auto leading-relaxed">
              {success
                ? 'Redirecting to administrator signup...'
                : isDispatching
                ? 'Sending secure 6-digit passcode to the master administrator...'
                : `A dynamic 6-digit OTP has been sent to Master Admin (${maskedEmail}). Enter it below to unlock registration.`}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-center text-xs font-semibold text-red-700 animate-fade-in">
            {errorMsg}
          </div>
        )}

        {/* 6 DIGIT OTP INPUTS */}
        {!success && (
          <div className="space-y-5">
            <div
              className="flex items-center justify-center gap-2 sm:gap-2.5 my-2"
              onPaste={handlePaste}
            >
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isSubmitting || success || isDispatching}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-10 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-lg border transition-all outline-none ${
                    errorMsg
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : digit
                      ? 'border-ink-black bg-paper-white text-ink-black shadow-xs'
                      : 'border-smoke-gray bg-paper-white text-ink-black focus:border-ink-black'
                  }`}
                />
              ))}
            </div>

            {/* Resend Action */}
            <div className="flex items-center justify-center text-xs text-pewter pt-1">
              <button
                type="button"
                disabled={resendCooldown > 0 || isSubmitting || isDispatching}
                onClick={() => dispatchOtp()}
                className="flex items-center gap-1.5 hover:text-ink-black disabled:opacity-50 disabled:hover:text-pewter cursor-pointer disabled:cursor-not-allowed font-medium"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isDispatching ? 'animate-spin' : ''}`}
                />
                <span>
                  {resendCooldown > 0
                    ? `Resend security code (${resendCooldown}s)`
                    : 'Resend security code to Master Admin'}
                </span>
              </button>
            </div>

            <button
              type="button"
              disabled={isSubmitting || isDispatching || digits.some((d) => !d)}
              onClick={() => handleVerifyOtp(digits.join(''))}
              className="btn-sprout-primary w-full h-11"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Code...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Verify & Unlock</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        )}

        {/* Footer Return Home */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-sprout-ghost w-full text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Cancel & Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
