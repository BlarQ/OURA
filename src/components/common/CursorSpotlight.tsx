'use client';

import { useEffect, useRef } from 'react';

export default function CursorSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animFrame: number;

    const updatePos = (e: MouseEvent) => {
      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(() => {
        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
          spotlightRef.current.style.opacity = '1';
        }
      });
    };

    window.addEventListener('mousemove', updatePos, { passive: true });
    return () => {
      window.removeEventListener('mousemove', updatePos);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* 3D Hardware-Accelerated Cursor Follower (Zero React Rerenders) */}
      <div
        ref={spotlightRef}
        className="absolute w-[450px] h-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/8 to-cyan-400/8 blur-3xl opacity-0 transition-opacity duration-500 will-change-transform pointer-events-none"
        style={{ top: 0, left: 0 }}
      />
    </div>
  );
}
