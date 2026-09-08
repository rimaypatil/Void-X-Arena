'use client';

import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Award,
  Skull,
  CheckCircle2,
  Medal,
  Flame,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ResultPlayer {
  id: string;
  rank: number;
  inGameName: string;
  kills: number;
  prizeAmount: number;
  killPrizeAmount: number;
  totalPrizeAmount: number;
  isWinner: boolean;
}

interface ResultedMatch {
  id: string;
  title: string;
  gameMode: string;
  map: string;
  prizeAmount: number;
  perKillPrize: number | null;
  matchDate: string;
  status: string;
  result?: {
    id: string;
    status: string;
    publishedAt: string;
    summary?: string;
    players: ResultPlayer[];
  } | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  inGameName: string;
  matchesPlayed: number;
  wins: number;
  totalKills: number;
  totalEarnings: number;
  winRate: number;
}

export default function ArenaResultsPage() {
  const [viewMode, setViewMode] = useState<'MATCHES' | 'LEADERBOARD'>('MATCHES');
  const [matches, setMatches] = useState<ResultedMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<'earnings' | 'kills' | 'wins'>('earnings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'MATCHES') {
        const res = await fetch('/api/v1/matches?status=RESULTED');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMatches(json.data);
        } else {
          setError(json.error?.message || 'Failed to load resulted matches.');
        }
      } else {
        const res = await fetch(`/api/v1/leaderboard?sortBy=${sortBy}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.entries)) {
          setLeaderboard(json.data.entries);
        } else {
          setError(json.error?.message || 'Failed to load leaderboard.');
        }
      }
    } catch {
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewMode, sortBy]);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-void-800 via-void-850 to-void-900 border border-purple-brand/40 shadow-purple-sm">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-purple-bright" />
          <span className="text-[10px] font-display font-extrabold uppercase tracking-wider text-purple-bright">
            Official Esports Records
          </span>
        </div>
        <h2 className="font-display font-black text-lg text-void-100 uppercase tracking-tight">
          Verified Hall of Champions
        </h2>
        <p className="text-[11px] text-void-300 mt-0.5">
          Authoritative tournament outcomes, verified kills, and ledger-credited prize settlements.
        </p>

        {/* View Mode Segmented Control */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-void-750">
          <button
            onClick={() => setViewMode('MATCHES')}
            className={`py-1.5 px-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'MATCHES'
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'bg-void-900/80 text-void-300 border border-void-700 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Match Results</span>
          </button>

          <button
            onClick={() => setViewMode('LEADERBOARD')}
            className={`py-1.5 px-3 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'LEADERBOARD'
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'bg-void-900/80 text-void-300 border border-void-700 hover:text-white'
            }`}
          >
            <Medal className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-void-850 border border-void-750 animate-pulse space-y-2">
              <div className="h-4 bg-void-700 rounded w-1/3" />
              <div className="h-8 bg-void-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-5 rounded-xl bg-void-850 border border-status-danger/40 text-center">
          <AlertCircle className="w-8 h-8 text-status-danger mx-auto mb-2" />
          <p className="text-xs text-void-200 font-bold">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData} className="mt-3 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* MATCHES VIEW */}
      {!loading && !error && viewMode === 'MATCHES' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="p-8 rounded-xl bg-void-850 border border-void-750 text-center">
              <Trophy className="w-10 h-10 text-void-500 mx-auto mb-2 opacity-50" />
              <h4 className="font-display font-bold text-xs uppercase text-void-200">
                No Resulted Tournaments Yet
              </h4>
              <p className="text-[11px] text-void-400 mt-1">
                Completed matches will appear here once authoritative scores and prizes are published.
              </p>
            </div>
          ) : (
            matches.map((match) => {
              const players = match.result?.players || [];
              const winner = players.find((p) => p.isWinner || p.rank === 1);
              const mvp = [...players].sort((a, b) => b.kills - a.kills)[0];
              const isExpanded = expandedMatchId === match.id;

              return (
                <div
                  key={match.id}
                  className="p-3.5 rounded-xl bg-void-850 border border-void-700/80 shadow-card-dark flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between border-b border-void-800 pb-2">
                    <div>
                      <span className="text-[9px] font-display font-extrabold uppercase text-purple-bright">
                        {match.gameMode.replace(/_/g, ' ')} • {match.map}
                      </span>
                      <h4 className="font-display font-black text-xs sm:text-sm text-void-100 uppercase mt-0.5">
                        {match.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-display font-bold text-status-success bg-status-success/15 px-2 py-0.5 rounded border border-status-success/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>RESULTED</span>
                    </div>
                  </div>

                  {/* Champion & MVP Highlights */}
                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-void-900 border border-void-750 text-xs">
                    <div>
                      <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
                        Champion (Booyah)
                      </span>
                      <p className="font-display font-black text-xs text-purple-highlight flex items-center gap-1 mt-0.5">
                        <Award className="w-3.5 h-3.5 text-purple-bright shrink-0" />
                        <span className="truncate">{winner?.inGameName || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
                        Match MVP & Kills
                      </span>
                      <p className="font-display font-black text-xs text-void-100 flex items-center justify-end gap-1 mt-0.5">
                        <Skull className="w-3 h-3 text-status-danger" />
                        <span>
                          {mvp ? `${mvp.inGameName} (${mvp.kills} kills)` : 'None'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Summary & Expandable Details Button */}
                  <div className="flex items-center justify-between text-[10px] text-void-400 pt-1">
                    <span>
                      Prize Pool: <strong className="text-purple-bright font-mono">₹{match.prizeAmount.toFixed(2)}</strong>
                    </span>
                    <button
                      onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                      className="text-purple-bright font-display font-bold hover:underline flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Standings' : 'Full Scoreboard'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Detailed Scoreboard Drawer */}
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-void-800 space-y-1.5 animate-fadeIn">
                      <div className="grid grid-cols-12 text-[9px] font-display font-bold uppercase text-void-400 px-2 py-1 bg-void-900/60 rounded">
                        <span className="col-span-2">Rank</span>
                        <span className="col-span-5">Contender (IGN)</span>
                        <span className="col-span-2 text-center">Kills</span>
                        <span className="col-span-3 text-right">Prize Won</span>
                      </div>
                      {players.map((p) => (
                        <div
                          key={p.id}
                          className={`grid grid-cols-12 items-center text-xs px-2 py-1.5 rounded-lg border ${
                            p.rank === 1
                              ? 'bg-purple-brand/15 border-purple-brand/40 text-purple-highlight font-bold'
                              : 'bg-void-900 border-void-800 text-void-200'
                          }`}
                        >
                          <span className="col-span-2 font-mono text-[11px]">#{p.rank}</span>
                          <span className="col-span-5 truncate text-[11px] font-display">{p.inGameName}</span>
                          <span className="col-span-2 text-center font-mono text-[11px] text-void-300">{p.kills}</span>
                          <span className="col-span-3 text-right font-mono font-bold text-status-success text-[11px]">
                            ₹{Number(p.totalPrizeAmount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* LEADERBOARD VIEW */}
      {!loading && !error && viewMode === 'LEADERBOARD' && (
        <div className="space-y-3">
          {/* Sorting Controls */}
          <div className="flex items-center justify-between bg-void-850 p-2 rounded-xl border border-void-750 text-xs">
            <span className="text-[10px] font-display font-bold uppercase text-void-400 pl-1">
              Rank Metric:
            </span>
            <div className="flex items-center gap-1.5">
              {(['earnings', 'kills', 'wins'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSortBy(metric)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
                    sortBy === metric
                      ? 'bg-purple-brand text-white shadow-purple-sm'
                      : 'bg-void-900 text-void-400 hover:text-white border border-void-750'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-8 rounded-xl bg-void-850 border border-void-750 text-center">
              <Medal className="w-10 h-10 text-void-500 mx-auto mb-2 opacity-50" />
              <h4 className="font-display font-bold text-xs uppercase text-void-200">
                Leaderboard Initializing
              </h4>
              <p className="text-[11px] text-void-400 mt-1">
                Contenders will be ranked here as official tournament results are verified.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const isPodium = entry.rank <= 3;
                const podiumBorder =
                  entry.rank === 1
                    ? 'border-status-warning/60 bg-gradient-to-r from-status-warning/10 to-void-850'
                    : entry.rank === 2
                    ? 'border-void-400/60 bg-gradient-to-r from-void-400/10 to-void-850'
                    : entry.rank === 3
                    ? 'border-purple-brand/60 bg-gradient-to-r from-purple-brand/10 to-void-850'
                    : 'border-void-800 bg-void-850';

                return (
                  <div
                    key={entry.userId}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs shadow-card-dark ${podiumBorder}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-xs shrink-0 ${
                          entry.rank === 1
                            ? 'bg-status-warning text-void-950 shadow-purple-sm'
                            : entry.rank === 2
                            ? 'bg-void-300 text-void-950'
                            : entry.rank === 3
                            ? 'bg-purple-brand text-white'
                            : 'bg-void-800 text-void-400'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-display font-bold text-void-100 text-xs truncate max-w-[140px] sm:max-w-xs">
                          {entry.inGameName}
                        </p>
                        <span className="text-[9px] text-void-400 font-mono">
                          {entry.matchesPlayed} matches • {entry.wins} Booyahs • {entry.totalKills} kills
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-display font-black text-sm text-status-success font-mono">
                        ₹{entry.totalEarnings.toFixed(2)}
                      </p>
                      <span className="text-[9px] text-purple-bright font-display font-bold">
                        {entry.winRate}% Win Rate
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
