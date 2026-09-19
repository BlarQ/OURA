'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, X, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';

interface SecretCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
}

const SECRET_CODE = '1997';

export default function SecretCodeModal({
  isOpen,
  onClose,
  onSuccess,
  redirectTo = '/signup',
}: SecretCodeModalProps) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = [
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

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setError(false);
      setSuccess(false);
      setIsVerifying(false);
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setError(false);

    if (cleaned && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      verifyCode(newDigits.join(''));
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const arr = pasted.split('');
      setDigits(arr);
      verifyCode(pasted);
    }
  };

  const verifyCode = (enteredCode: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      if (enteredCode === SECRET_CODE) {
        setSuccess(true);
        setError(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mymanual_auth_gate', '1997_authorized_' + Date.now());
        }
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(redirectTo);
          }
          onClose();
        }, 500);
      } else {
        setError(true);
        setSuccess(false);
        setIsVerifying(false);
        setTimeout(() => {
          onClose();
          router.push('/');
        }, 1200);
      }
    }, 300);
  };

  const handleCancel = () => {
    onClose();
    router.push('/');
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain animate-backdrop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isVerifying) {
          handleCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md my-auto bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-6 sm:p-8 space-y-6 text-[#040404] max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar animate-modal-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCancel}
          disabled={isVerifying}
          className="absolute top-4 right-4 p-2 text-[#6e797a] hover:text-[#040404] rounded-[6px] hover:bg-[#f4f4f4] transition cursor-pointer disabled:opacity-50"
          aria-label="Close and return to home"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className={`w-12 h-12 rounded-[6px] mx-auto flex items-center justify-center ${
              error
                ? 'bg-red-100 text-red-700 border border-red-300'
                : success
                ? 'bg-[#98e58e] text-[#040404]'
                : 'bg-[#040404] text-[#ffffff]'
            }`}
          >
            {error ? (
              <ShieldAlert className="h-6 w-6" />
            ) : success ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Lock className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[#040404] tracking-tight">
              {success ? 'Access Granted' : 'Security Authorization'}
            </h3>
            <p className="text-xs text-[#6e797a] max-w-xs mx-auto">
              {success
                ? 'Redirecting to account creation...'
                : error
                ? 'Incorrect security passcode. Returning to home...'
                : 'Enter the 4-digit master code to unlock registration.'}
            </p>
          </div>
        </div>

        {/* 4 Digit Input Boxes */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 my-6"
          onPaste={handlePaste}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={isVerifying || success || error}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-extrabold rounded-[6px] border transition-all outline-none ${
                error
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : success
                  ? 'border-[#98e58e] bg-[#98e58e]/20 text-[#040404]'
                  : digit
                  ? 'border-[#040404] bg-[#ffffff] text-[#040404]'
                  : 'border-[#cbcece] bg-[#ffffff] text-[#040404] focus:border-[#040404]'
              }`}
            />
          ))}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-center text-xs font-bold text-red-700">
            Unauthorized code. Returning to home screen...
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-sprout-ghost w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel & Return Home
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
