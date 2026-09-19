'use client';

import { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import SecretCodeModal from '@/components/auth/SecretCodeModal';

interface SecretTriggerButtonProps {
  variant?: 'subtle' | 'icon' | 'badge';
  className?: string;
  label?: string;
}

export default function SecretTriggerButton({
  variant = 'subtle',
  className = '',
  label,
}: SecretTriggerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SecretCodeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        redirectTo="/signup"
      />

      {variant === 'icon' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="System Provisioning"
          className={`p-1.5 text-slate-700 hover:text-indigo-400 rounded-lg hover:bg-slate-900/80 transition cursor-pointer ${className}`}
        >
          <KeyRound className="h-3.5 w-3.5 opacity-50 hover:opacity-100 transition" />
        </button>
      )}

      {variant === 'badge' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`group flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-400 transition cursor-pointer ${className}`}
        >
          <Lock className="h-3 w-3 opacity-40 group-hover:opacity-100 transition" />
          <span>{label || 'Provisioning'}</span>
        </button>
      )}

      {variant === 'subtle' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`text-[11px] text-slate-700 hover:text-indigo-400 transition cursor-pointer ${className}`}
        >
          {label || 'System Provisioning'}
        </button>
      )}
    </>
  );
}
