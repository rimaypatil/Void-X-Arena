'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

const HARD_SAFETY_TIMEOUT_MS = 5500; // Guaranteed exit timer
const ANIMATION_DURATION_MS = 4500; // Normal visual transition duration before fade-out
const FADE_OUT_DURATION_MS = 500; // Fade-out duration into app (4.5s + 0.5s = 5.0s total)

export const StartupSplash: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Session check to prevent repeating splash on internal route navigation
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const hasPlayed = sessionStorage.getItem('vxa_splash_shown');
        if (hasPlayed) {
          setIsVisible(false);
          return;
        }
        sessionStorage.setItem('vxa_splash_shown', 'true');
      }
    } catch {
      // Fallback if sessionStorage is disabled/blocked
    }

    // 2. Reduced motion preference check
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setPrefersReducedMotion(true);
      }
    }

    // 3. Dismissal sequence trigger
    const triggerDismissal = () => {
      setIsFadingOut(true);
      dismissTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, FADE_OUT_DURATION_MS);
    };

    // 4. Normal animation lifecycle
    transitionTimerRef.current = setTimeout(() => {
      triggerDismissal();
    }, ANIMATION_DURATION_MS);

    // 5. HARD SAFETY TIMEOUT: Force exit no matter what happens
    safetyTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, HARD_SAFETY_TIMEOUT_MS);

    // Cleanup timers on unmount
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] bg-[#08080D] flex flex-col items-center justify-center select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 transition-opacity duration-500 ease-out pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full bg-purple-brand/20 blur-[90px] sm:blur-[120px] pointer-events-none transition-all duration-1000 ${
          prefersReducedMotion ? 'opacity-30' : 'animate-pulse'
        }`}
      />

      {/* Main Branded Logo Assembly */}
      <div className="relative z-10 flex flex-col items-center gap-4 p-6 text-center">
        {/* Emblem Wrapper */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Energy Aura Ring */}
          {!prefersReducedMotion && (
            <div className="absolute inset-0 rounded-full bg-purple-brand/30 blur-md scale-110 animate-ping opacity-25" />
          )}

          {/* Official Emblem Image */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <Image
              src="/assets/images/logo/logo-mark.png"
              alt="Void X Arena Emblem"
              fill
              priority
              sizes="(max-width: 768px) 96px, 112px"
              className={`object-contain filter drop-shadow-[0_0_20px_rgba(139,92,246,0.55)] ${
                prefersReducedMotion
                  ? 'opacity-100'
                  : 'transition-all duration-700 ease-out scale-100'
              }`}
            />
          </div>
        </div>

        {/* Wordmark & Tagline Reveal */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-display font-black text-xl sm:text-2xl tracking-widest text-void-100 uppercase">
            VOID <span className="text-purple-brand drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]">X</span> ARENA
          </h1>
          <p className="text-[10px] sm:text-xs font-display font-bold uppercase tracking-[0.25em] text-purple-bright/90">
            Esports Tournament Platform
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress Line */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-void-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r from-purple-brand to-purple-bright rounded-full transition-all duration-1000 ${
            prefersReducedMotion ? 'w-full' : 'w-full animate-pulse'
          }`}
        />
      </div>
    </div>
  );
};
