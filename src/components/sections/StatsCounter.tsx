'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';
import { Users, Trophy, Gamepad2, CheckCircle2 } from 'lucide-react';

interface StatItem {
  id: string;
  label: string;
  targetValue: number;
  prefix?: string;
  suffix?: string;
  subtext: string;
  icon: React.ReactNode;
}

export const StatsCounter: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    players: 0,
    tournaments: 0,
    prizes: 0,
    ontime: 0,
  });

  const stats: StatItem[] = [
    {
      id: 'players',
      label: 'Active Contenders',
      targetValue: 0,
      suffix: '+',
      subtext: 'Free Fire squads',
      icon: <Users className="w-4 h-4 text-purple-bright" />,
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      targetValue: 0,
      suffix: '+',
      subtext: 'Daily rooms & cups',
      icon: <Gamepad2 className="w-4 h-4 text-purple-highlight" />,
    },
    {
      id: 'prizes',
      label: 'Prize Distributed',
      targetValue: 0,
      prefix: '₹',
      suffix: '+',
      subtext: 'Verified payouts',
      icon: <Trophy className="w-4 h-4 text-purple-soft" />,
    },
    {
      id: 'ontime',
      label: 'On-Time Start',
      targetValue: 0,
      suffix: '%',
      subtext: 'Auto synchronization',
      icon: <CheckCircle2 className="w-4 h-4 text-status-success" />,
    },
  ];

  useEffect(() => {
    if (!isInView) return;

    const duration = 1600;
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = easeOutExpo(frame / totalFrames);

      setCounts({
        players: Math.round(0 * progress),
        tournaments: Math.round(0 * progress),
        prizes: Math.round(0 * progress),
        ontime: Math.round(0 * progress),
      });

      if (frame === totalFrames) {
        clearInterval(timer);
        setCounts({
          players: 0,
          tournaments: 0,
          prizes: 0,
          ontime: 0,
        });
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [isInView]);

  function easeOutExpo(x: number): number {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  return (
    <section ref={ref} className="py-6 sm:py-10 lg:py-16 bg-void-950 border-y border-void-800 relative">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {stats.map((item) => (
            <div
              key={item.id}
              className="flex flex-col p-2.5 sm:p-4 lg:p-5 rounded-xl bg-void-800 border border-void-600 relative group hover:border-purple-brand/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                <span className="text-[9px] sm:text-xs font-display font-bold uppercase tracking-wider text-void-300 truncate">
                  {item.label}
                </span>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-void-850 border border-void-700 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
              </div>

              <div className="font-display font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl text-void-100 flex items-baseline tracking-tight">
                {item.prefix && (
                  <span className="text-purple-bright mr-0.5 text-sm sm:text-xl md:text-2xl">
                    {item.prefix}
                  </span>
                )}
                <span>
                  {counts[item.id].toLocaleString()}
                </span>
                {item.suffix && (
                  <span className="text-purple-highlight ml-0.5 text-xs sm:text-lg md:text-xl">
                    {item.suffix}
                  </span>
                )}
              </div>

              <span className="text-[9px] sm:text-xs text-void-300 mt-0.5 sm:mt-1 truncate">
                {item.subtext}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
