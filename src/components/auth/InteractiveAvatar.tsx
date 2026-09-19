'use client';

import { useEffect, useRef } from 'react';

interface InteractiveAvatarProps {
  isPasswordFocused?: boolean;
  isTypingEmail?: boolean;
}

export default function InteractiveAvatar({
  isPasswordFocused = false,
  isTypingEmail = false,
}: InteractiveAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<SVGGElement>(null);
  const rightPupilRef = useRef<SVGGElement>(null);

  // Track mouse coordinates directly on DOM refs with requestAnimationFrame (0 React re-renders)
  useEffect(() => {
    let animFrame: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || isPasswordFocused) return;

      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const avatarCenterX = rect.left + rect.width / 2;
        const avatarCenterY = rect.top + rect.height / 2;

        // Vector from avatar to mouse
        const deltaX = e.clientX - avatarCenterX;
        const deltaY = e.clientY - avatarCenterY;
        const distance = Math.hypot(deltaX, deltaY);

        // Max eye travel radius in px
        const maxEyeRadius = 7.5;
        const angle = Math.atan2(deltaY, deltaX);
        const clampedDist = Math.min(distance / 25, maxEyeRadius);

        const eyeX = Math.cos(angle) * clampedDist;
        const eyeY = Math.sin(angle) * clampedDist;

        // Head 3D tilt calculation (-12deg to +12deg)
        const windowCenterX = window.innerWidth / 2;
        const windowCenterY = window.innerHeight / 2;
        const rotY = ((e.clientX - windowCenterX) / windowCenterX) * 12;
        const rotX = -((e.clientY - windowCenterY) / windowCenterY) * 10;

        if (headRef.current) {
          headRef.current.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
        }

        const eyeTransform = `translate3d(${eyeX.toFixed(2)}px, ${eyeY.toFixed(2)}px, 0)`;
        if (leftPupilRef.current) {
          leftPupilRef.current.style.transform = eyeTransform;
        }
        if (rightPupilRef.current) {
          rightPupilRef.current.style.transform = eyeTransform;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, [isPasswordFocused]);

  return (
    <div
      ref={containerRef}
      className="relative w-28 h-28 mx-auto flex items-center justify-center select-none"
      style={{ perspective: '800px' }}
    >
      {/* 3D Tilt Head Container */}
      <div
        ref={headRef}
        className="relative w-26 h-26 rounded-full transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: isPasswordFocused
            ? 'rotateX(15deg) rotateY(0deg) scale(0.96)'
            : 'rotateX(0deg) rotateY(0deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Main Avatar SVG Illustration */}
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
        >
          <defs>
            {/* Hair Gradient */}
            <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#162020" />
              <stop offset="100%" stopColor="#040404" />
            </linearGradient>

            {/* Glasses Tone */}
            <linearGradient id="visorGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#98e58e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#98e58e" stopOpacity="0.15" />
            </linearGradient>

            {/* Eye Iris */}
            <linearGradient id="irisGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#040404" />
              <stop offset="100%" stopColor="#162020" />
            </linearGradient>
          </defs>

          {/* Hair Back */}
          <path
            d="M25 55 Q20 20 60 18 Q100 20 95 55 Q102 75 90 90 Q60 100 30 90 Q18 75 25 55"
            fill="url(#hairGrad)"
          />

          {/* Face Base */}
          <circle cx="60" cy="62" r="38" fill="#ffedd5" stroke="#fed7aa" strokeWidth="1.5" />

          {/* Subtle Blush */}
          <ellipse cx="36" cy="74" rx="5" ry="3" fill="#fca5a5" opacity="0.35" />
          <ellipse cx="84" cy="74" rx="5" ry="3" fill="#fca5a5" opacity="0.35" />

          {/* Hair Front */}
          <path
            d="M32 40 Q60 26 88 40 Q75 48 60 46 Q45 48 32 40"
            fill="#040404"
          />

          {/* IT Headset Band & Earcups */}
          <path
            d="M24 58 Q18 25 60 22 Q102 25 96 58"
            fill="none"
            stroke="#040404"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Left Earcup */}
          <rect x="16" y="52" width="9" height="19" rx="4" fill="#040404" />
          <circle cx="20.5" cy="61.5" r="2" fill="#98e58e" />
          {/* Right Earcup */}
          <rect x="95" y="52" width="9" height="19" rx="4" fill="#040404" />
          <circle cx="99.5" cy="61.5" r="2" fill="#98e58e" />

          {/* Headset Mic boom */}
          <path
            d="M21 68 Q24 88 45 88"
            fill="none"
            stroke="#040404"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="46" cy="88" r="3" fill="#98e58e" />

          {/* EYEBALLS (White) */}
          <g>
            <ellipse cx="44" cy="62" rx="10" ry="10" fill="#ffffff" stroke="#d9d9d9" strokeWidth="1.5" />
            <ellipse cx="76" cy="62" rx="10" ry="10" fill="#ffffff" stroke="#d9d9d9" strokeWidth="1.5" />
          </g>

          {/* PUPILS */}
          {!isPasswordFocused ? (
            <g>
              {/* Left Pupil */}
              <g ref={leftPupilRef} className="will-change-transform">
                <circle cx="44" cy="62" r="5" fill="url(#irisGrad)" />
                <circle cx="44" cy="62" r="2.8" fill="#040404" />
                <circle cx="42.5" cy="60.5" r="1.5" fill="#ffffff" />
              </g>

              {/* Right Pupil */}
              <g ref={rightPupilRef} className="will-change-transform">
                <circle cx="76" cy="62" r="5" fill="url(#irisGrad)" />
                <circle cx="76" cy="62" r="2.8" fill="#040404" />
                <circle cx="74.5" cy="60.5" r="1.5" fill="#ffffff" />
              </g>
            </g>
          ) : (
            /* Password Blindfold Mode */
            <g stroke="#040404" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M35 64 Q44 60 53 64" />
              <path d="M67 64 Q76 60 85 64" />
            </g>
          )}

          {/* Eyebrows */}
          <path
            d={
              isPasswordFocused
                ? 'M35 50 Q44 54 53 52'
                : 'M35 52 Q44 48 53 51'
            }
            fill="none"
            stroke="#040404"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={
              isPasswordFocused
                ? 'M67 52 Q76 54 85 50'
                : 'M67 51 Q76 48 85 52'
            }
            fill="none"
            stroke="#040404"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Smile */}
          <path
            d={
              isPasswordFocused
                ? 'M53 82 Q60 85 67 82'
                : isTypingEmail
                ? 'M52 82 Q60 88 68 82'
                : 'M50 80 Q60 87 70 80'
            }
            fill="none"
            stroke="#040404"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Clean Glasses Frame (6px radius style) */}
          <g>
            <rect
              x="30"
              y="50"
              width="28"
              height="24"
              rx="6"
              fill="url(#visorGrad)"
              stroke="#040404"
              strokeWidth="2"
            />
            <rect
              x="62"
              y="50"
              width="28"
              height="24"
              rx="6"
              fill="url(#visorGrad)"
              stroke="#040404"
              strokeWidth="2"
            />
            <path d="M58 58 L62 58" stroke="#040404" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Password Privacy Hands */}
          {isPasswordFocused && (
            <g>
              <ellipse cx="43" cy="62" rx="13" ry="9" fill="#fed7aa" stroke="#040404" strokeWidth="1.5" />
              <ellipse cx="77" cy="62" rx="13" ry="9" fill="#fed7aa" stroke="#040404" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
