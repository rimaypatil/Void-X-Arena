'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Swords, Trophy, Users, Clock, AlertCircle, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HeroCarousel } from '@/components/arena/HeroCarousel';

interface MatchItem {
  id: string;
  contestId: string;
  title: string;
  bannerImage: string;
  gameMode: string;
  map: string;
  status: string;
  matchTime: string;
  entryFee: number;
  prizeAmount: number;
  perKillPrize: number | null;
  totalSlots: number;
  filledSlots: number;
  version: string;
  game: {
    name: string;
    image: string;
    badge: string | null;
  };
}

type StatusFilterType = 'ONGOING' | 'UPCOMING' | 'COMPLETED';

export default function ArenaMatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [gameFilter, setGameFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('UPCOMING');
  const [userHasSelectedStatus, setUserHasSelectedStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/matches');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const fetchedMatches: MatchItem[] = json.data;
        setMatches(fetchedMatches);

        // Dynamically set default status filter if user hasn't explicitly chosen one:
        // Prefer ONGOING if active ongoing matches exist, otherwise UPCOMING.
        if (!userHasSelectedStatus) {
          const hasOngoing = fetchedMatches.some((m) => m.status === 'ONGOING');
          const hasUpcoming = fetchedMatches.some((m) => m.status === 'UPCOMING');
          if (hasOngoing) {
            setStatusFilter('ONGOING');
          } else if (hasUpcoming) {
            setStatusFilter('UPCOMING');
          } else {
            setStatusFilter('UPCOMING');
          }
        }
      } else {
        setError(json.error?.message || 'Failed to load fixtures.');
      }
    } catch {
      setError('Unable to connect to game servers. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Combined Status + Game Mode Filtering
  const filteredMatches = matches.filter((m) => {
    // 1. Authoritative Status Filter
    if (statusFilter === 'ONGOING' && m.status !== 'ONGOING') return false;
    if (statusFilter === 'UPCOMING' && m.status !== 'UPCOMING') return false;
    if (statusFilter === 'COMPLETED' && m.status !== 'RESULTED') return false;

    // 2. Game Mode Filter
    if (gameFilter === 'BR' && !m.gameMode.includes('BATTLE_ROYALE')) return false;
    if (gameFilter === 'CS' && !m.gameMode.includes('CLASH_SQUAD')) return false;
    if (gameFilter === 'DUEL' && !m.gameMode.includes('DUEL') && !m.gameMode.includes('LONE')) return false;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Featured Admin-Controlled Arena Banner Carousel */}
      <HeroCarousel />

      {/* Lifecycle Status Selector (ONGOING | UPCOMING | COMPLETED) */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-void-900 rounded-xl border border-void-750 text-xs font-display font-bold">
        {(
          [
            { id: 'ONGOING', label: 'Ongoing' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'COMPLETED', label: 'Completed' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setUserHasSelectedStatus(true);
              setStatusFilter(tab.id);
            }}
            className={`py-2 rounded-lg uppercase tracking-wider text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-1.5 ${
              statusFilter === tab.id
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'text-void-400 hover:text-void-200'
            }`}
          >
            {tab.id === 'ONGOING' && (
              <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block animate-pulse shrink-0" />
            )}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Game Mode Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: 'All Arenas', id: 'ALL' },
          { label: 'Battle Royale', id: 'BR' },
          { label: 'Clash Squad', id: 'CS' },
          { label: '1v1 Duels', id: 'DUEL' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setGameFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-display font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
              gameFilter === tab.id
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'bg-void-800 text-void-300 hover:text-void-100 border border-void-700/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 rounded-xl bg-void-850 border border-void-700 animate-pulse flex flex-col gap-3"
            >
              <div className="h-4 bg-void-700 rounded w-2/3" />
              <div className="h-10 bg-void-800 rounded w-full" />
              <div className="h-3 bg-void-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="p-5 rounded-xl bg-void-850 border border-status-danger/40 text-center flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-status-danger mb-2" />
          <p className="font-display font-bold text-xs text-void-100 uppercase">
            Failed to load tournaments
          </p>
          <p className="text-[11px] text-void-300 mt-1 mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatches}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Context-Aware Empty State */}
      {!loading && !error && filteredMatches.length === 0 && (
        <div className="p-8 rounded-xl bg-void-850 border border-void-700 text-center">
          <Swords className="w-10 h-10 text-void-500 mx-auto mb-2 opacity-50" />
          <h3 className="font-display font-bold text-xs sm:text-sm text-void-200 uppercase">
            No {statusFilter.toLowerCase()} fixtures
          </h3>
          <p className="text-[11px] text-void-400 mt-1">
            There are currently no {statusFilter.toLowerCase()} matches in{' '}
            {gameFilter === 'ALL'
              ? 'any game mode'
              : gameFilter === 'BR'
              ? 'Battle Royale'
              : gameFilter === 'CS'
              ? 'Clash Squad'
              : '1v1 Duels'}
            .
          </p>
        </div>
      )}

      {/* Matches List */}
      {!loading && !error && filteredMatches.length > 0 && (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const fillPct = Math.round((match.filledSlots / match.totalSlots) * 100);
            const cardImage = match.bannerImage || match.game?.image || '/assets/images/freefire/battle-royale.jpg';
            const isOngoing = match.status === 'ONGOING';
            const isCompleted = match.status === 'RESULTED';

            return (
              <div
                key={match.id}
                className="group rounded-xl overflow-hidden bg-void-850 border border-void-700 hover:border-purple-brand/70 transition-all duration-200 shadow-card-dark flex flex-col"
              >
                {/* Match Header with Artwork & Overlay Badges */}
                <div className="relative w-full aspect-[16/7] overflow-hidden bg-void-900">
                  <Image
                    src={cardImage}
                    alt={match.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 450px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void-850 via-void-850/40 to-void-950/60" />

                  <div className="absolute inset-x-0 top-0 p-2.5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-void-900/85 backdrop-blur-md border border-purple-brand/50">
                      <span
                        className={`w-1.5 h-1.5 rounded-full inline-block ${
                          isOngoing
                            ? 'bg-status-warning animate-pulse'
                            : isCompleted
                            ? 'bg-status-success'
                            : 'bg-status-success inline-block animate-pulse'
                        }`}
                      />
                      <span className="text-[9px] font-display font-extrabold uppercase text-purple-bright">
                        {match.gameMode.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Authoritative Status Badge */}
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] font-display font-bold uppercase px-2 py-0.5 rounded border backdrop-blur-md ${
                          isOngoing
                            ? 'bg-status-warning/20 text-status-warning border-status-warning/40 animate-pulse'
                            : isCompleted
                            ? 'bg-status-success/20 text-status-success border-status-success/40'
                            : 'bg-void-900/85 text-void-200 border-void-700'
                        }`}
                      >
                        {isCompleted ? 'COMPLETED' : match.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-3 flex-1 flex flex-col gap-2.5">
                  <h3 className="font-display font-black text-sm text-void-100 uppercase tracking-wide leading-snug group-hover:text-purple-highlight transition-colors">
                    {match.title}
                  </h3>

                  {/* Prize & Entry Matrix */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-void-900 border border-void-750 text-xs">
                    <div>
                      <span className="text-[8px] font-display font-bold uppercase text-void-400 flex items-center gap-1">
                        <Trophy className="w-2.5 h-2.5 text-purple-bright" />
                        Prize Pool
                      </span>
                      <p className="text-sm font-display font-black text-purple-highlight">
                        ₹{match.prizeAmount}
                      </p>
                      {match.perKillPrize && (
                        <span className="text-[8px] text-void-300 block">
                          +₹{match.perKillPrize}/kill
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] font-display font-bold uppercase text-void-400">
                        Entry Fee
                      </span>
                      <p className="text-sm font-display font-black text-void-100">
                        ₹{match.entryFee}
                      </p>
                      <span className="text-[8px] text-status-success font-medium">
                        Verified Slot
                      </span>
                    </div>
                  </div>

                  {/* Slot Fill Progress */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-display font-bold text-void-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-void-400" />
                        Slots
                      </span>
                      <span>
                        {match.filledSlots}/{match.totalSlots}{' '}
                        <span className="text-purple-bright">({fillPct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-void-900 rounded-full overflow-hidden border border-void-750">
                      <div
                        className="h-full bg-gradient-to-r from-purple-brand to-purple-bright rounded-full transition-all duration-300"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Meta & Action */}
                  <div className="pt-2 border-t border-void-800 flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1 text-[10px] text-void-300">
                      <Clock className="w-3 h-3 text-purple-bright" />
                      <span>{match.matchTime}</span>
                    </div>

                    {isCompleted ? (
                      <Link
                        href={`/arena/results?matchId=${match.id}`}
                        className="px-3 py-1.5 rounded-md bg-status-success/20 hover:bg-status-success text-status-success hover:text-black text-[10px] font-display font-bold uppercase tracking-wider transition-all flex items-center gap-1 border border-status-success/40"
                      >
                        <span>View Results</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <Link
                        href={`/arena/matches/${match.id}`}
                        className="px-3 py-1.5 rounded-md bg-purple-brand hover:bg-purple-hover text-white text-[10px] font-display font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-purple-sm"
                      >
                        <span>{isOngoing ? 'View Match' : 'Join Match'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

