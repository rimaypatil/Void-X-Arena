'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tournament } from '@/types/tournament';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Users, Clock, Trophy, ChevronRight, Info } from 'lucide-react';

export interface TournamentCardProps {
  tournament: Tournament;
  onSelect: (tournament: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onSelect }) => {
  const fillPercentage = Math.round((tournament.filledSlots / tournament.totalSlots) * 100);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="group relative flex flex-col bg-void-800 border border-void-600 hover:border-purple-brand rounded-lg p-3.5 sm:p-5 shadow-card-dark transition-all duration-200"
    >
      {/* Top Accent Line on Hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Card Header: Status & Map */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <StatusBadge status={tournament.status} />
        <span className="text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider text-void-300 bg-void-700 px-1.5 py-0.5 rounded border border-void-600 truncate max-w-[130px]">
          {tournament.map}
        </span>
      </div>

      {/* Title & Mode */}
      <div className="mb-2.5 sm:mb-3.5">
        <span className="text-[10px] sm:text-[11px] font-display font-bold text-purple-bright uppercase tracking-wider">
          {tournament.gameModeLabel}
        </span>
        <h3 className="font-display font-black text-sm sm:text-base md:text-lg text-void-100 group-hover:text-white uppercase tracking-wide line-clamp-1 mt-0.5">
          {tournament.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-void-300 line-clamp-1 mt-0.5">
          {tournament.subtitle}
        </p>
      </div>

      {/* Prize Pool & Entry Fee Matrix */}
      <div className="grid grid-cols-2 gap-2 p-2 sm:p-3 rounded-md bg-void-850 border border-void-700/80 mb-3">
        <div>
          <span className="text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-wider text-void-300 flex items-center gap-1">
            <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-bright" />
            Prize Pool
          </span>
          <p className="text-base sm:text-lg font-display font-black text-purple-highlight">
            {tournament.prizePoolLabel}
          </p>
          {tournament.perKillPrize ? (
            <span className="text-[9px] sm:text-[10px] text-void-300">₹{tournament.perKillPrize}/kill</span>
          ) : (
            <span className="text-[9px] sm:text-[10px] text-void-400">Fixed Prize</span>
          )}
        </div>

        <div className="text-right">
          <span className="text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-wider text-void-300">
            Entry Fee
          </span>
          <p className="text-base sm:text-lg font-display font-black text-void-100">
            ₹{tournament.entryFee}
          </p>
          <span className="text-[9px] sm:text-[10px] text-status-success font-medium">Verified Slot</span>
        </div>
      </div>

      {/* Slots Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-display font-semibold text-void-300 mb-1">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-void-400" />
            Slots
          </span>
          <span className="font-bold text-void-100 text-[11px] sm:text-xs">
            {tournament.filledSlots}/{tournament.totalSlots}{' '}
            <span className="text-purple-highlight text-[10px] sm:text-[11px]">({fillPercentage}%)</span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-void-850 rounded-full overflow-hidden border border-void-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              fillPercentage >= 90
                ? 'bg-status-danger'
                : 'bg-gradient-to-r from-purple-brand to-purple-bright'
            }`}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      {/* Start Time & Device Tag */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-void-300 mb-3.5 pt-2 sm:pt-2.5 border-t border-void-700/60">
        <span className="flex items-center gap-1 truncate max-w-[180px]">
          <Clock className="w-3 h-3 text-purple-bright shrink-0" />
          <span className="truncate">{tournament.startTimeFormatted}</span>
        </span>
        <span className="text-[9px] sm:text-[10px] font-display font-bold text-void-300 bg-void-700 px-1.5 py-0.5 rounded shrink-0">
          {tournament.version}
        </span>
      </div>

      {/* Action CTA & Info Trigger */}
      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect(tournament)}
          className="!min-h-[34px] !px-2 shrink-0"
          aria-label="View tournament rules"
        >
          <Info className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onSelect(tournament)}
          className="flex-1 !min-h-[34px] !text-[11px] sm:!text-xs"
          icon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Join Match
        </Button>
      </div>
    </motion.div>
  );
};
