'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  ctaText?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: 'default-1',
    title: 'Free Fire Daily Cups',
    subtitle: 'Automated custom rooms, instant slot locking, and verified payouts.',
    badge: 'SEASON 1 REGISTRATION',
    ctaText: 'Enter Arena',
    imageUrl: '/assets/images/freefire/esports.jpg',
    linkUrl: '/arena',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'default-2',
    title: 'Weekend Clash Squad 4v4 Tournament',
    subtitle: 'Fast-paced elimination rounds with instant prize pool distribution.',
    badge: 'HIGH STAKES LOBBY',
    ctaText: 'View Matches',
    imageUrl: '/assets/images/freefire/clash-squad.jpg',
    linkUrl: '/arena',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'default-3',
    title: 'Battle Royale Bermuda Showdown',
    subtitle: '50-contender survival arena. Secure high placement & per-kill rewards.',
    badge: 'SOLO & SQUAD',
    ctaText: 'Join Tournament',
    imageUrl: '/assets/images/freefire/battle-royale.jpg',
    linkUrl: '/arena',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'default-4',
    title: 'Verified Automated Wallet Payouts',
    subtitle: 'Transparent skill rewards deposited directly to your wallet balance after match settlement.',
    badge: 'VERIFIED LEDGER',
    ctaText: 'Check Wallet',
    imageUrl: '/assets/images/arena/hero-arena-banner.jpg',
    linkUrl: '/arena/wallet',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'default-5',
    title: 'Live Tournament Results & Leaderboards',
    subtitle: 'Real-time match scoring, kill logs, and official standings.',
    badge: 'LEADERBOARD LIVE',
    ctaText: 'View Standings',
    imageUrl: '/assets/images/gaming-retro-bg.jpg',
    linkUrl: '/arena/results',
    displayOrder: 5,
    isActive: true,
  },
];

const AUTO_SLIDE_INTERVAL = 6000; // 6 seconds per banner

export const HeroCarousel: React.FC<{ initialBanners?: BannerItem[] }> = ({ initialBanners }) => {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>(
    initialBanners && initialBanners.length > 0 ? initialBanners : DEFAULT_BANNERS
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffsetX, setDragOffsetX] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Gesture tracking refs
  const pointerStartXRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const wasDraggingRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active banners from public API
  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/banners');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const activeOnly = json.data.filter((b: BannerItem) => b.isActive !== false);
          if (activeOnly.length > 0) {
            setBanners(activeOnly);
          }
        }
      }
    } catch {
      // Retain fallback banners safely on failure
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Listen to prefers-reduced-motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Single timer manager: pause during drag, reset/restart on slide change
  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (!prefersReducedMotion && banners.length > 1 && !isDragging) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, AUTO_SLIDE_INTERVAL);
    }
  }, [banners.length, prefersReducedMotion, isDragging, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return () => {
      stopAutoplay();
    };
  }, [currentIndex, isDragging, startAutoplay, stopAutoplay]);

  // Navigation helpers (continuous loop 1 -> 2 -> 3 -> 4 -> 5 -> 1)
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Unified Pointer Event Handlers for Touch Swipe and Desktop Mouse Drag
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;
    hasMovedRef.current = false;
    wasDraggingRef.current = false;
    setIsDragging(true);
    setDragOffsetX(0);

    if (e.pointerType === 'mouse') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback ignore
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerStartXRef.current === null) return;

    const deltaX = e.clientX - pointerStartXRef.current;
    const deltaY = e.clientY - (pointerStartYRef.current ?? e.clientY);

    // If vertical scrolling dominates early on touch devices, abort horizontal drag tracking
    if (!hasMovedRef.current && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      pointerStartXRef.current = null;
      pointerStartYRef.current = null;
      setIsDragging(false);
      setDragOffsetX(0);
      return;
    }

    if (!hasMovedRef.current && Math.abs(deltaX) > 8) {
      hasMovedRef.current = true;
      if (e.pointerType === 'touch') {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Fallback ignore
        }
      }
    }

    if (hasMovedRef.current) {
      let offset = deltaX;
      if ((currentIndex === 0 && deltaX > 0) || (currentIndex === banners.length - 1 && deltaX < 0)) {
        offset = deltaX * 0.4;
      }
      setDragOffsetX(offset);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartXRef.current === null) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Fallback ignore
    }

    const deltaX = dragOffsetX;
    const threshold = 40; // 40px drag threshold

    if (hasMovedRef.current && Math.abs(deltaX) >= threshold) {
      wasDraggingRef.current = true;
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else if (hasMovedRef.current) {
      wasDraggingRef.current = true;
    }

    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
    setIsDragging(false);
    setDragOffsetX(0);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Fallback ignore
    }
    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
    setIsDragging(false);
    setDragOffsetX(0);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Banner destination link click handler
  const handleBannerClick = (banner: BannerItem) => {
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }

    const targetUrl = banner.linkUrl || '/arena';

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      router.push(targetUrl);
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional Arena Banners"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-brand/25 via-void-850 to-void-900 border border-purple-brand/40 shadow-purple-sm select-none outline-none focus:ring-1 focus:ring-purple-brand"
    >
      <div
        className="relative min-h-[160px] sm:min-h-[180px] w-full overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* Horizontal Slide Track */}
        <div
          className="flex w-full h-full"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffsetX}px))`,
            transition: isDragging || prefersReducedMotion ? 'none' : 'transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {banners.map((b, index) => {
            const imgPath = b.imageUrl || '/assets/images/freefire/esports.jpg';
            return (
              <div
                key={b.id}
                aria-hidden={index !== currentIndex}
                onClick={() => handleBannerClick(b)}
                className="min-w-full w-full flex-shrink-0 relative flex items-center p-4 sm:p-5 sm:px-6 min-h-[160px] sm:min-h-[180px] cursor-pointer"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={imgPath}
                    alt={b.title || 'Promotional Banner'}
                    fill
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover object-center filter brightness-[0.35] contrast-[1.1]"
                    onError={(e: any) => {
                      e.target.src = '/assets/images/freefire/esports.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-void-900/65 to-transparent" />
                </div>

                {/* Banner Content & CTA */}
                <div className="relative z-20 w-full pr-14 sm:pr-16">
                  {/* Badge / Tag */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-void-900/90 border border-purple-brand/50 text-[9px] sm:text-[10px] font-display font-black text-purple-bright mb-2 shadow-purple-sm">
                    <Flame className="w-3 h-3 text-purple-bright shrink-0" />
                    <span className="uppercase tracking-wider">
                      {b.badge || 'PROMOTIONAL ARENA'}
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 className="font-display font-black text-base sm:text-xl text-void-100 uppercase tracking-tight leading-snug drop-shadow-md">
                    {b.title}
                  </h2>

                  {/* Subtitle / Description */}
                  {b.subtitle && (
                    <p className="text-[11px] sm:text-xs text-void-300 mt-1 max-w-sm leading-relaxed line-clamp-2">
                      {b.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Dots Only */}
        <div className="absolute bottom-2.5 right-3.5 z-30 flex items-center gap-1.5 pointer-events-auto">
          {banners.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              aria-label={`Go to banner ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 bg-purple-brand shadow-purple-sm'
                  : 'w-1.5 bg-void-600 hover:bg-void-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};


