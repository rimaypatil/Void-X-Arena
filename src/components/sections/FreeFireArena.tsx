'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download, Swords, Flame, Trophy, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ArenaCard {
  category: string;
  categoryIcon: React.ReactNode;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
}

const arenaCards: ArenaCard[] = [
  {
    category: 'BATTLE ROYALE',
    categoryIcon: <Flame className="w-3.5 h-3.5 text-purple-bright" />,
    title: 'BATTLE. SURVIVE. BOOYAH.',
    description: 'Drop into the battlefield, loot fast, outplay your opponents, and be the last player or squad standing.',
    ctaText: 'EXPLORE BATTLE ROYALE',
    ctaHref: '#app-download',
    imageSrc: '/assets/images/freefire/battle-royale.jpg',
    imageAlt: 'Free Fire Battle Royale squad gameplay',
  },
  {
    category: 'CLASH SQUAD',
    categoryIcon: <Swords className="w-3.5 h-3.5 text-purple-highlight" />,
    title: 'SQUAD UP. FIGHT TO WIN.',
    description: 'Team up with your squad and take on fast-paced rounds where every elimination matters.',
    ctaText: 'EXPLORE CLASH SQUAD',
    ctaHref: '#app-download',
    imageSrc: '/assets/images/freefire/clash-squad.jpg',
    imageAlt: 'Free Fire Clash Squad gameplay',
  },
  {
    category: 'ESPORTS',
    categoryIcon: <Trophy className="w-3.5 h-3.5 text-purple-soft" />,
    title: 'PLAY LIKE A CHAMPION.',
    description: 'Step into competitive Free Fire and build your path from everyday matches to serious esports competition.',
    ctaText: 'ENTER THE ARENA',
    ctaHref: '#app-download',
    imageSrc: '/assets/images/freefire/esports.jpg',
    imageAlt: 'Free Fire esports competition',
  },
];

export const FreeFireArena: React.FC = () => {
  return (
    <section id="free-fire" className="py-8 sm:py-12 lg:py-20 bg-void-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-subtle-grid bg-[size:24px_24px] sm:bg-[size:48px_48px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[700px] h-[250px] sm:h-[400px] bg-purple-brand/10 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[280px] sm:w-[500px] h-[200px] sm:h-[350px] bg-purple-deep/12 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-purple-brand/40 shadow-purple-sm mb-2 sm:mb-3">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-brand animate-pulse" />
            <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
              Free Fire Experience
            </span>
          </div>

          <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100">
            Enter The Free Fire Arena
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-void-300 mt-2 sm:mt-3 leading-relaxed max-w-2xl mx-auto">
            Compete, survive, and dominate across the world&apos;s most intense mobile battle royale action.
            <span className="block text-purple-highlight/90 font-medium mt-0.5">
              Your next match starts in the Void X Arena app.
            </span>
          </p>

          {/* Section Level CTAs */}
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            <Button
              asAnchor
              href="#app-download"
              variant="primary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              iconPosition="left"
              className="!px-4 sm:!px-5 !py-2 text-xs sm:text-sm shadow-purple-sm"
            >
              Download The App
            </Button>

            <Button
              asAnchor
              href="#game-modes"
              variant="secondary"
              size="sm"
              icon={<Swords className="w-4 h-4 text-purple-bright" />}
              iconPosition="right"
              className="!px-4 sm:!px-5 !py-2 text-xs sm:text-sm"
            >
              Explore Free Fire
            </Button>
          </div>
        </div>

        {/* 3 Large Visual Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-7">
          {arenaCards.map((card) => (
            <motion.div
              key={card.category}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-void-850 border border-void-600 hover:border-purple-brand/80 transition-all duration-300 shadow-card-dark hover:shadow-purple-sm"
            >
              {/* Card Image Wrapper with 16:10 Aspect Ratio on Desktop & Controlled Height on Mobile */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] overflow-hidden bg-void-900">
                <Image
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Multi-layered Cinematic Dark Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-void-850 via-void-850/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-void-900/60 via-transparent to-void-850" />

                {/* Top Category Badge */}
                <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-void-900/85 backdrop-blur-md border border-purple-brand/50 shadow-md">
                  {card.categoryIcon}
                  <span className="text-[10px] sm:text-[11px] font-display font-extrabold uppercase tracking-widest text-purple-bright">
                    {card.category}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="relative p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-between -mt-6 sm:-mt-8 z-10">
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg lg:text-xl text-void-100 uppercase tracking-tight group-hover:text-purple-highlight transition-colors leading-snug mb-2">
                    {card.title}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-void-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Card CTA */}
                <div className="mt-4 pt-3.5 border-t border-void-700/60 flex items-center justify-between">
                  <a
                    href={card.ctaHref}
                    className="inline-flex items-center text-xs sm:text-[13px] font-display font-bold uppercase tracking-wider text-purple-bright group-hover:text-purple-highlight transition-all"
                  >
                    <span>{card.ctaText}</span>
                  </a>

                  <span className="text-[10px] font-sans text-void-400 uppercase tracking-wider hidden sm:inline-block">
                    In-App Arena
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informative App-First Banner */}
        <div className="mt-6 sm:mt-10 p-3.5 sm:p-5 rounded-xl bg-gradient-to-r from-void-900 via-void-850 to-void-900 border border-purple-brand/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-brand/15 border border-purple-brand/40 flex items-center justify-center text-purple-bright shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="font-display font-black text-xs sm:text-sm text-void-100 uppercase">
                Official Matches Organized Daily Inside The App
              </h4>
              <p className="text-[10px] sm:text-xs text-void-300 mt-0.5">
                Download the Void X Arena Android APK to register your player UID, select match formats, and join live rooms.
              </p>
            </div>
          </div>

          <Button
            asAnchor
            href="#app-download"
            variant="primary"
            size="sm"
            className="shrink-0 w-full sm:w-auto !min-h-[34px] !text-xs"
          >
            Get Void X App
          </Button>
        </div>

      </div>
    </section>
  );
};
