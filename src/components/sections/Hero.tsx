'use client';

import React from 'react';
import Image from 'next/image';
import { Download, Swords, ShieldCheck, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Hero: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative pt-16 sm:pt-24 lg:pt-32 pb-10 sm:pb-16 lg:pb-24 flex items-center justify-center overflow-hidden bg-void-900 min-h-0 lg:min-h-[75vh]"
    >
      {/* BACKGROUND LAYER 1: Subtle Tactical Grid & Radial Ambient Purple Glow */}
      <div className="absolute inset-0 bg-subtle-grid bg-[size:24px_24px] sm:bg-[size:40px_40px] opacity-30 sm:opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[650px] h-[300px] sm:h-[450px] bg-purple-brand/12 rounded-full blur-[80px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[240px] sm:w-[450px] h-[180px] sm:h-[300px] bg-purple-deep/15 rounded-full blur-[70px] sm:blur-[120px] pointer-events-none" />

      {/* BACKGROUND LAYER 2: Provided Gaming Asset Integrated With Purple Void Atmosphere */}
      <div className="absolute top-0 right-0 w-full lg:w-3/4 h-full overflow-hidden opacity-20 sm:opacity-30 lg:opacity-35 pointer-events-none select-none">
        <div className="relative w-full h-full transform lg:scale-105 origin-top-right">
          <Image
            src="/assets/images/gaming-retro-bg.jpg"
            alt="Void X Arena Gaming Battleground"
            fill
            priority
            className="object-cover object-top sm:object-center filter brightness-[0.65] contrast-[1.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-void-900 via-void-900/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-void-900 via-transparent to-void-900/90" />
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 text-center flex flex-col items-center">
        {/* Status Live Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-void-800 border border-purple-brand/40 shadow-purple-sm mb-3 sm:mb-4">
          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-bright opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-purple-brand" />
          </span>
          <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-wider text-purple-bright">
            Free Fire Season 4 Tournaments Live
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display font-black text-[28px] sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-tight text-void-100 leading-[1.06] sm:leading-[1.05] max-w-3xl">
          Enter The Arena.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-brand via-purple-bright to-purple-highlight">
            Compete. Dominate.
          </span>{' '}
          Earn.
        </h1>

        {/* Supporting Copy */}
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-void-300 max-w-2xl leading-relaxed mx-auto">
          The premier competitive esports platform for Free Fire solo, duo, and squad champions. Join verified daily custom rooms, clash squads, and battle royale fixtures with instant automated room credentials.
        </p>

        {/* Action CTAs */}
        <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 w-full sm:w-auto">
          <Button
            asAnchor
            href="#app-download"
            variant="primary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            iconPosition="left"
            className="w-full sm:w-auto"
          >
            Download App (APK)
          </Button>

          <Button
            asAnchor
            href="#free-fire"
            variant="secondary"
            size="md"
            icon={<Swords className="w-4 h-4 text-purple-bright" />}
            iconPosition="right"
            className="w-full sm:w-auto"
          >
            Explore Free Fire
          </Button>
        </div>

        {/* Trust Badges Ribbon */}
        <div className="mt-6 sm:mt-8 pt-3.5 sm:pt-5 border-t border-void-700/60 flex flex-wrap items-center justify-center gap-3.5 sm:gap-8 text-[11px] sm:text-xs text-void-300">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success shrink-0" />
            <span>Anti-Cheat Protected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-bright shrink-0" />
            <span>Automated Room Pass</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-purple-highlight shrink-0" />
            <span>Verified Match Payouts</span>
          </div>
        </div>
      </div>
    </section>
  );
};
