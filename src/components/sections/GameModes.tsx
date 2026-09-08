'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { gameModesData } from '@/data/gameModes';
import { Crosshair, Swords, UserCheck, Zap, ShieldAlert, Trophy, MapPin, Users, Target } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const GameModes: React.FC = () => {
  const getModeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crosshair':
        return <Crosshair className="w-5 h-5 text-purple-bright" />;
      case 'Swords':
        return <Swords className="w-5 h-5 text-purple-highlight" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-purple-bright" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-purple-blue" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-purple-soft" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-purple-bright" />;
      default:
        return <Target className="w-5 h-5 text-purple-bright" />;
    }
  };

  return (
    <section id="game-modes" className="py-8 sm:py-12 lg:py-20 bg-void-850 relative">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-void-600 mb-1.5 sm:mb-3">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-brand" />
            <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
              Competitive Formats
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100">
            Tournament Game Modes
          </h2>
          <p className="text-xs sm:text-sm text-void-300 mt-1.5 sm:mt-2">
            Diverse competitive formats tailored for solo clutchers and coordinated 4-man squads.
          </p>
        </div>

        {/* Asymmetrical Game Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {gameModesData.map((mode, index) => {
            const isFeatured = index === 0;
            return (
              <motion.div
                key={mode.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18 }}
                className={`relative flex flex-col justify-between rounded-xl p-3.5 sm:p-5 lg:p-6 border transition-all duration-200 ${
                  isFeatured
                    ? 'bg-gradient-to-b from-void-800 to-void-700 border-purple-brand/50 shadow-purple-sm'
                    : 'bg-void-800 border-void-600 hover:border-purple-brand/40'
                }`}
              >
                {/* Corner highlight indicator */}
                {isFeatured && (
                  <div className="absolute top-0 right-0 overflow-hidden w-16 h-16 sm:w-20 sm:h-20 rounded-tr-xl pointer-events-none">
                    <div className="absolute transform rotate-45 bg-purple-brand text-white font-display font-black text-[8px] sm:text-[9px] uppercase tracking-widest py-0.5 sm:py-1 right-[-35px] top-[14px] sm:top-[18px] w-[110px] sm:w-[120px] text-center shadow-sm">
                      FEATURED
                    </div>
                  </div>
                )}

                <div>
                  {/* Icon & Mode Badge */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-void-850 border border-void-700 flex items-center justify-center shadow-inner shrink-0">
                      {getModeIcon(mode.iconName)}
                    </div>
                    <Badge variant={isFeatured ? 'purple' : 'surface'} size="xs">
                      {mode.featuredStat}
                    </Badge>
                  </div>

                  {/* Mode Title & Tagline */}
                  <h3 className="font-display font-black text-base sm:text-lg text-void-100 uppercase tracking-wide">
                    {mode.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-purple-highlight font-display font-semibold mt-0.5">
                    {mode.tagline}
                  </p>

                  <p className="text-[11px] sm:text-xs text-void-300 leading-relaxed mt-2">
                    {mode.description}
                  </p>
                </div>

                {/* Tactical Parameters Footer */}
                <div className="mt-4 pt-3 border-t border-void-700/60 grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                  <div className="flex items-center gap-1.5 text-void-300 truncate">
                    <Users className="w-3 h-3 text-purple-bright shrink-0" />
                    <span className="truncate">{mode.teamSize}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-void-300 truncate">
                    <MapPin className="w-3 h-3 text-purple-highlight shrink-0" />
                    <span className="truncate">{mode.mapOptions[0]}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
