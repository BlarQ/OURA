'use client';

import { useState } from 'react';
import { Lock, Shield } from 'lucide-react';
import SecretCodeModal from '@/components/auth/SecretCodeModal';

interface SecretTriggerButtonProps {
  variant?: 'subtle' | 'icon' | 'badge';
  className?: string;
  label?: string;
}

export default function SecretTriggerButton({
  variant = 'icon',
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
          aria-label="Security Authorization"
          className={`p-1 text-pewter/30 hover:text-pewter rounded transition cursor-pointer ${className}`}
        >
          <Lock className="h-3 w-3 opacity-30 hover:opacity-100 transition-opacity" />
        </button>
      )}

      {variant === 'badge' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`group flex items-center gap-1.5 text-xs text-pewter hover:text-ink-black transition cursor-pointer ${className}`}
        >
          <Shield className="h-3 w-3 opacity-40 group-hover:opacity-100 transition" />
          <span>{label || 'Admin Auth'}</span>
        </button>
      )}

      {variant === 'subtle' && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`text-[11px] text-pewter/50 hover:text-pewter transition cursor-pointer ${className}`}
        >
          {label || 'Security'}
        </button>
      )}
    </>
  );
}
