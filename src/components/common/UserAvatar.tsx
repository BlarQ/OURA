'use client';

import React from 'react';

interface UserAvatarProps {
  fullName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function getInitials(name?: string): string {
  if (!name || name.trim() === '' || name === 'User') return 'OU';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ fullName = 'User', size = 'md', className = '' }: UserAvatarProps) {
  const initials = getInitials(fullName);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px] font-black',
    md: 'w-9 h-9 text-xs font-black',
    lg: 'w-12 h-12 text-sm font-black',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md border border-white/20 select-none tracking-wider shrink-0 ${className}`}
      title={fullName}
    >
      {initials}
    </div>
  );
}
