'use client';

import React, { useState } from 'react';
import { Tournament } from '@/types/tournament';
import { mockTournaments } from '@/data/tournaments';
import { TournamentCard } from './TournamentCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Download, ShieldCheck, Trophy } from 'lucide-react';

type FilterCategory = 'ALL' | 'BATTLE_ROYALE' | 'CLASH_SQUAD' | '1V1' | 'HIGH_ROLLER';

export const TournamentsHub: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const filterTabs: { label: string; value: FilterCategory }[] = [
    { label: 'All Arenas', value: 'ALL' },
    { label: 'Battle Royale', value: 'BATTLE_ROYALE' },
    { label: 'Clash Squad 4v4', value: 'CLASH_SQUAD' },
    { label: '1v1 Duels', value: '1V1' },
    { label: 'High Roller / Cups', value: 'HIGH_ROLLER' },
  ];

  const filteredTournaments = mockTournaments.filter((t) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'BATTLE_ROYALE') {
      return t.gameMode === 'BATTLE_ROYALE_SQUAD' || t.gameMode === 'BATTLE_ROYALE_SOLO';
    }
    if (activeFilter === 'CLASH_SQUAD') return t.gameMode === 'CLASH_SQUAD_4V4';
    if (activeFilter === '1V1') return t.gameMode === 'DUEL_1V1';
    if (activeFilter === 'HIGH_ROLLER') {
      return t.gameMode === 'CUSTOM_CUP' || t.gameMode === 'SURVIVAL_WAR';
    }
    return true;
  });

  return (
    <section id="tournaments" className="py-8 sm:py-12 lg:py-20 bg-void-950 relative">
      <div className="absolute inset-0 bg-subtle-grid bg-[size:24px_24px] sm:bg-[size:50px_50px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-8 lg:mb-10 gap-2 sm:gap-6">
          <div>
            <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-brand" />
              <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
                Verified Match Schedule
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100">
              The Arena Is Live
            </h2>
            <p className="text-xs sm:text-sm text-void-300 max-w-xl mt-1">
              Browse today’s verified Free Fire fixtures. Secure your slot, receive automated in-app room pass credentials, and compete for rewards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-display text-void-300 uppercase tracking-wider">
              {filteredTournaments.length} Tournaments
            </span>
          </div>
        </div>

        {/* Filter Navigation Tabs (Smooth touch horizontal scrollbar) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-display font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap shrink-0 ${
                activeFilter === tab.value
                  ? 'bg-purple-brand text-white shadow-purple-sm'
                  : 'bg-void-800 text-void-300 hover:text-void-100 hover:bg-void-700 border border-void-600/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onSelect={(t) => setSelectedTournament(t)}
            />
          ))}
        </div>

        {/* Bottom Fast Track Banner */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-void-850 via-void-800 to-void-850 border border-purple-brand/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-brand/20 border border-purple-brand/40 flex items-center justify-center text-purple-bright shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-black text-sm sm:text-base text-void-100 uppercase">
                Want to host a private guild scrim?
              </h4>
              <p className="text-[11px] sm:text-xs text-void-300 mt-0.5">
                Void X Arena supports custom private rooms with automated scorekeeping and custom prize pools.
              </p>
            </div>
          </div>
          <Button
            asAnchor
            href="#contact"
            variant="outline"
            size="sm"
            className="shrink-0 w-full sm:w-auto"
          >
            Request Private Scrim
          </Button>
        </div>

      </div>

      {/* Tournament Details Modal */}
      {selectedTournament && (
        <Modal
          isOpen={Boolean(selectedTournament)}
          onClose={() => setSelectedTournament(null)}
          title={selectedTournament.title}
          subtitle={`${selectedTournament.gameModeLabel} • ${selectedTournament.map} • ${selectedTournament.version}`}
          maxWidth="lg"
        >
          <div className="space-y-4 sm:space-y-5">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-void-850 border border-void-700 text-center">
              <div>
                <span className="text-[9px] font-display font-bold uppercase text-void-300">
                  Prize Pool
                </span>
                <p className="text-base sm:text-lg font-display font-black text-purple-highlight">
                  {selectedTournament.prizePoolLabel}
                </p>
                {selectedTournament.perKillPrize && (
                  <span className="text-[9px] text-void-300 block">
                    + ₹{selectedTournament.perKillPrize}/kill
                  </span>
                )}
              </div>
              <div>
                <span className="text-[9px] font-display font-bold uppercase text-void-300">
                  Entry Fee
                </span>
                <p className="text-base sm:text-lg font-display font-black text-void-100">
                  ₹{selectedTournament.entryFee}
                </p>
                <span className="text-[9px] text-status-success block font-medium">Verified Slot</span>
              </div>
              <div>
                <span className="text-[9px] font-display font-bold uppercase text-void-300">
                  Start Schedule
                </span>
                <p className="text-xs sm:text-sm font-display font-bold text-void-200 mt-0.5 truncate">
                  {selectedTournament.startTimeFormatted}
                </p>
              </div>
            </div>

            {/* Prize Breakdown Table */}
            <div>
              <h4 className="text-xs font-display font-black uppercase tracking-wider text-void-100 mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-purple-bright" />
                Prize Distribution
              </h4>
              <div className="bg-void-850 rounded-md border border-void-700/80 overflow-hidden text-xs">
                <div className="grid grid-cols-2 p-2 bg-void-700 font-display font-bold text-void-300 border-b border-void-700 text-[11px]">
                  <span>Placement / Reward</span>
                  <span className="text-right">Prize Amount</span>
                </div>
                {selectedTournament.prizeBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 p-2 border-b border-void-800 last:border-0 hover:bg-void-800/40 text-[11px]"
                  >
                    <span className="text-void-200 font-medium">{item.rank}</span>
                    <span className="text-right font-display font-bold text-purple-highlight">
                      {item.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Rules */}
            <div>
              <h4 className="text-xs font-display font-black uppercase tracking-wider text-void-100 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                Match Rules
              </h4>
              <ul className="space-y-1.5 text-[11px] sm:text-xs text-void-300 list-disc list-inside">
                {selectedTournament.rules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Room Credentials Note */}
            <div className="p-2.5 rounded-md bg-purple-brand/10 border border-purple-brand/30 text-[11px] text-void-200">
              <strong className="text-purple-bright font-display block mb-0.5">
                ⚡ Room Pass Delivery:
              </strong>
              Room ID and Password are delivered via the Void X Arena mobile app exactly 15 minutes before match start.
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <Button
                asAnchor
                href="#app-download"
                variant="primary"
                size="md"
                className="w-full sm:flex-1"
                icon={<Download className="w-4 h-4" />}
                onClick={() => setSelectedTournament(null)}
              >
                Download App to Register
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedTournament(null)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};
