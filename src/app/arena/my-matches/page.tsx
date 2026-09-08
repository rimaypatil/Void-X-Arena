'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Swords,
  Clock,
  Trophy,
  Users,
  Lock,
  Unlock,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface MyMatchItem {
  joiningId: string;
  slotNumber: number;
  teamNumber: number;
  inGameName: string;
  inGameId: string;
  match: {
    id: string;
    contestId: string;
    title: string;
    map: string;
    gameMode: string;
    status: 'UPCOMING' | 'ONGOING' | 'RESULTED';
    matchTime: string;
    entryFee: number;
    prizeAmount: number;
    perKillPrize: number | null;
  };
  roomAccess: {
    isUnlocked: boolean;
    credentials: { roomId: string; roomPassword: string } | null;
    countdownSeconds?: number;
    reason?: string;
  };
}

export default function MyMatchesPage() {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'ONGOING' | 'RESULTED'>('UPCOMING');
  const [matches, setMatches] = useState<MyMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchMyMatches = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/my-matches?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.matches)) {
        setMatches(json.data.matches);
      } else {
        setError(json.error?.message || 'Failed to load My Matches.');
      }
    } catch {
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyMatches();
  }, [activeTab, accessToken]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!user) {
    return (
      <div className="p-6 rounded-2xl bg-void-850 border border-void-700 text-center my-auto">
        <Swords className="w-12 h-12 text-purple-bright mx-auto mb-3 opacity-80" />
        <h3 className="font-display font-black text-base text-void-100 uppercase">
          Sign In to View Your Fixtures
        </h3>
        <p className="text-xs text-void-300 mt-1.5 mb-5 max-w-xs mx-auto">
          Track your registered Free Fire matches, receive automated room codes, and claim prize winnings.
        </p>
        <Button asAnchor href="/arena/auth/login" variant="primary" size="md" className="w-full">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[9px] font-display font-extrabold uppercase text-purple-bright tracking-wider">
            Tournament Dashboard
          </span>
          <h2 className="font-display font-black text-base text-void-100 uppercase">
            My Tournaments
          </h2>
        </div>
        <button
          onClick={fetchMyMatches}
          className="p-1.5 rounded-lg bg-void-850 hover:bg-void-800 text-void-300 border border-void-700"
          aria-label="Refresh matches"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dynamic Tabs: Upcoming, Ongoing, Resulted */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-void-900 rounded-xl border border-void-750 text-xs font-display font-bold">
        {(['UPCOMING', 'ONGOING', 'RESULTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 rounded-lg uppercase tracking-wider text-[10px] sm:text-[11px] transition-all ${
              activeTab === tab
                ? 'bg-purple-brand text-white shadow-purple-sm'
                : 'text-void-400 hover:text-void-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="p-4 rounded-xl bg-void-850 border border-void-750 animate-pulse space-y-2"
            >
              <div className="h-4 bg-void-700 rounded w-1/2" />
              <div className="h-8 bg-void-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error Retry */}
      {!loading && error && (
        <div className="p-5 rounded-xl bg-void-850 border border-status-danger/40 text-center">
          <AlertCircle className="w-8 h-8 text-status-danger mx-auto mb-2" />
          <p className="text-xs text-void-200 font-bold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMyMatches}
            className="mt-3 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && matches.length === 0 && (
        <div className="p-8 rounded-xl bg-void-850 border border-void-750 text-center">
          <Swords className="w-10 h-10 text-void-500 mx-auto mb-2 opacity-50" />
          <h4 className="font-display font-bold text-xs uppercase text-void-200">
            No {activeTab.toLowerCase()} fixtures
          </h4>
          <p className="text-[11px] text-void-400 mt-1 mb-4">
            {activeTab === 'UPCOMING'
              ? 'You have not joined any upcoming matches.'
              : `No fixtures in ${activeTab.toLowerCase()} state.`}
          </p>
          {activeTab === 'UPCOMING' && (
            <Button asAnchor href="/arena" variant="primary" size="sm">
              Browse Matches
            </Button>
          )}
        </div>
      )}

      {/* Match Cards List */}
      {!loading && !error && matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((item) => (
            <div
              key={item.joiningId}
              className="p-3.5 rounded-xl bg-void-850 border border-void-700/80 shadow-card-dark flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between border-b border-void-800 pb-2">
                <span className="text-[9px] font-display font-extrabold uppercase text-purple-bright">
                  {item.match.gameMode.replace(/_/g, ' ')} • {item.match.map}
                </span>
                <span className="text-[9px] font-display font-bold uppercase text-status-success bg-status-success/15 px-2 py-0.5 rounded border border-status-success/30">
                  CONFIRMED
                </span>
              </div>

              <div>
                <h3 className="font-display font-black text-sm text-void-100 uppercase">
                  {item.match.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-void-300 mt-1">
                  <span>
                    Team #{item.teamNumber} • Slot #{item.slotNumber}
                  </span>
                  <span>•</span>
                  <span>IGN: {item.inGameName}</span>
                </div>
              </div>

              {/* Room Access Box (Directive 5) */}
              <div className="p-2.5 rounded-xl bg-void-900 border border-void-750 text-xs">
                {item.roomAccess.isUnlocked && item.roomAccess.credentials ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-status-success" />
                        <span className="text-[10px] font-display font-bold uppercase text-status-success">
                          Room Unlocked
                        </span>
                      </div>
                      <Link
                        href={`/arena/matches/${item.match.id}`}
                        className="text-[9px] text-purple-bright hover:underline"
                      >
                        Match Page →
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="p-1.5 rounded-lg bg-void-800 border border-void-700 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-purple-highlight font-bold">
                          ID: {item.roomAccess.credentials.roomId}
                        </span>
                        <button
                          onClick={() => copyText(item.roomAccess.credentials!.roomId, `id_${item.joiningId}`)}
                          className="text-void-400 hover:text-white"
                        >
                          {copiedKey === `id_${item.joiningId}` ? (
                            <Check className="w-3 h-3 text-status-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div className="p-1.5 rounded-lg bg-void-800 border border-void-700 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-purple-highlight font-bold">
                          PASS: {item.roomAccess.credentials.roomPassword}
                        </span>
                        <button
                          onClick={() => copyText(item.roomAccess.credentials!.roomPassword, `pass_${item.joiningId}`)}
                          className="text-void-400 hover:text-white"
                        >
                          {copiedKey === `pass_${item.joiningId}` ? (
                            <Check className="w-3 h-3 text-status-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-void-300">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-bright" />
                      <span>{item.roomAccess.reason || 'Room unlocks 15m before drop'}</span>
                    </div>
                    {item.roomAccess.countdownSeconds && (
                      <span className="text-purple-bright font-mono">
                        in {Math.ceil(item.roomAccess.countdownSeconds / 60)}m
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-void-400 pt-1 border-t border-void-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-bright" />
                  {item.match.matchTime}
                </span>
                <div className="flex items-center gap-3">
                  {item.match.status === 'RESULTED' && (
                    <Link
                      href={`/arena/results?matchId=${item.match.id}`}
                      className="text-status-success font-display font-bold hover:underline"
                    >
                      🏆 View Results →
                    </Link>
                  )}
                  <Link
                    href={`/arena/matches/${item.match.id}/participants`}
                    className="text-purple-bright font-display font-bold hover:underline"
                  >
                    View All Joinings →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
