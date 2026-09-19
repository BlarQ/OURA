'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  iconClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showWordmark?: boolean;
  variant?: 'green' | 'dark';
}

/**
 * AdeManual Official Brand Logo Image Component
 *
 * Renders the custom generated IT Developer Procedure Playbook logo:
 * - Sprout Green App Badge
 * - Open Technical Documentation Manual & Working Tools
 * - Developer Command Terminal Chevron ( > )
 * - Verified Operation Execution Checkmark ( ✔ )
 */
export default function BrandLogo({
  className = '',
  iconClassName = '',
  size = 'md',
  showWordmark = false,
  variant = 'green',
}: BrandLogoProps) {
  // Dimension mapping
  let pixelSize = 32;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 18;
        break;
      case 'sm':
        pixelSize = 24;
        break;
      case 'md':
        pixelSize = 32;
        break;
      case 'lg':
        pixelSize = 44;
        break;
      case 'xl':
        pixelSize = 56;
        break;
    }
  }

  const logoSrc =
    variant === 'dark'
      ? '/images/ademanual-dark-logo.png'
      : '/images/ademanual-logo.png';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Generated Logo Image Badge */}
      <div
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
        className={`relative overflow-hidden rounded-lg shrink-0 border border-smoke-gray/60 shadow-xs transition-transform duration-200 hover:scale-105 ${iconClassName}`}
      >
        <Image
          src={logoSrc}
          alt="AdeManual — IT Procedure Documentation & Operations"
          width={pixelSize * 2}
          height={pixelSize * 2}
          priority
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-ink-black leading-tight">
            AdeManual
          </span>
          <span className="text-[10px] uppercase font-bold text-pewter tracking-wider">
            IT Operations & Procedures
          </span>
        </div>
      )}
    </div>
  );
}
