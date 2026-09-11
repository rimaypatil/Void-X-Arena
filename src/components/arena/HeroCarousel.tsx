'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Flame, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

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
  const [isHoveredOrTouched, setIsHoveredOrTouched] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Touch Swipe tracking
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Active Banners from Public API
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
      // Retain default fallback banners safely
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Check Reduced Motion Preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // 2. Clear Timer Helper
  const clearAutoTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 3. Navigation Controls
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // 4. Auto-Play Timer Cycle
  useEffect(() => {
    clearAutoTimer();

    if (!isHoveredOrTouched && !prefersReducedMotion && banners.length > 1) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, AUTO_SLIDE_INTERVAL);
    }

    return () => clearAutoTimer();
  }, [isHoveredOrTouched, prefersReducedMotion, banners.length, handleNext, clearAutoTimer, currentIndex]);

  // 5. Touch / Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsHoveredOrTouched(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const deltaX = touchStartXRef.current - touchEndXRef.current;
      const minSwipeDistance = 40;

      if (deltaX > minSwipeDistance) {
        // Swiped Left -> Next Banner
        handleNext();
      } else if (deltaX < -minSwipeDistance) {
        // Swiped Right -> Previous Banner
        handlePrev();
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
    setIsHoveredOrTouched(false);
  };

  // 6. Keyboard Handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // 7. Click Banner Navigation Handler
  const handleBannerClick = (banner: BannerItem, e: React.MouseEvent) => {
    // Prevent trigger if clicking pagination or action buttons directly
    if ((e.target as HTMLElement).closest('.carousel-control-btn')) return;

    const targetUrl = banner.linkUrl || '/arena';

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      router.push(targetUrl);
    }
  };

  const activeBanner = banners[currentIndex] || DEFAULT_BANNERS[0];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional Arena Banners"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHoveredOrTouched(true)}
      onMouseLeave={() => setIsHoveredOrTouched(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-brand/25 via-void-850 to-void-900 border border-purple-brand/40 shadow-purple-sm select-none group outline-none focus:ring-1 focus:ring-purple-brand transition-all"
    >
      {/* Container aspect ratio & image stack */}
      <div className="relative min-h-[160px] sm:min-h-[180px] w-full flex items-center p-4 sm:p-5">
        {banners.map((b, index) => {
          const isActive = index === currentIndex;
          const imgPath = b.imageUrl || '/assets/images/freefire/esports.jpg';

          return (
            <div
              key={b.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
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
          );
        })}

        {/* Banner Content & CTA */}
        <div
          onClick={(e) => handleBannerClick(activeBanner, e)}
          className="relative z-20 w-full cursor-pointer pr-12 sm:pr-16"
        >
          {/* Badge / Tag */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-void-900/90 border border-purple-brand/50 text-[9px] sm:text-[10px] font-display font-black text-purple-bright mb-2 shadow-purple-sm">
            <Flame className="w-3 h-3 text-purple-bright shrink-0" />
            <span className="uppercase tracking-wider">
              {activeBanner.badge || 'PROMOTIONAL ARENA'}
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-display font-black text-base sm:text-xl text-void-100 uppercase tracking-tight leading-snug drop-shadow-md">
            {activeBanner.title}
          </h2>

          {/* Subtitle / Description */}
          {activeBanner.subtitle && (
            <p className="text-[11px] sm:text-xs text-void-300 mt-1 max-w-sm leading-relaxed line-clamp-2">
              {activeBanner.subtitle}
            </p>
          )}

          {/* CTA Link Hint */}
          <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-wider text-purple-bright hover:text-white transition-colors">
            <span>{activeBanner.ctaText || 'Explore Match'}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Previous Banner"
          className="carousel-control-btn absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-void-950/70 border border-void-700 text-void-300 hover:text-white hover:bg-void-900 transition-all opacity-80 group-hover:opacity-100 shadow-lg"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Banner"
          className="carousel-control-btn absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-void-950/70 border border-void-700 text-void-300 hover:text-white hover:bg-void-900 transition-all opacity-80 group-hover:opacity-100 shadow-lg"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Bottom Status Controls: Clean Pagination Indicators Only */}
        <div className="absolute bottom-2.5 right-3.5 z-30 flex items-center gap-1">
          {banners.map((b, idx) => (
            <button
              key={b.id}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`carousel-control-btn h-1.5 rounded-full transition-all duration-300 ${
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
