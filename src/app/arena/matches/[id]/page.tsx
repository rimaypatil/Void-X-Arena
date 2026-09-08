'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trophy,
  ShieldCheck,
  Clock,
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

interface MatchDetailsData {
  match: {
    id: string;
    contestId: string;
    title: string;
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
    prizeDistribution: Array<{ rank: string; amount: string }>;
    rules: Array<{ id: string; ruleText: string; displayOrder: number }>;
  };
  roomAccess: {
    isUnlocked: boolean;
    credentials: { roomId: string; roomPassword: string } | null;
    eligibility: {
      isEligible: boolean;
      reason?: string;
      countdownSeconds?: number;
    };
    userHasConfirmedJoining: boolean;
  };
}

export default function MatchDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [data, setData] = useState<MatchDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`/api/v1/matches/${params.id}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Match not found.');
      }
    } catch {
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [params.id, accessToken]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse py-4">
        <div className="h-6 bg-void-800 rounded w-1/3" />
        <div className="h-28 bg-void-850 rounded-2xl" />
        <div className="h-36 bg-void-850 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-void-850 border border-status-danger/40 text-center my-auto">
        <AlertCircle className="w-10 h-10 text-status-danger mx-auto mb-2" />
        <h3 className="font-display font-black text-sm text-void-100 uppercase">
          Match Error
        </h3>
        <p className="text-xs text-void-300 mt-1 mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back to Matches
        </Button>
      </div>
    );
  }

  const { match, roomAccess } = data;

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header Nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-void-850 border border-void-700 text-void-300 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <span className="text-[9px] font-display font-extrabold uppercase text-purple-bright tracking-wider">
            {match.gameMode.replace(/_/g, ' ')} • {match.map}
          </span>
          <h2 className="font-display font-black text-sm text-void-100 uppercase truncate">
            {match.title}
          </h2>
        </div>
      </div>

      {/* Prize & Entry Fee Matrix */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-void-800 via-void-850 to-void-900 border border-purple-brand/40 shadow-purple-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[9px] font-display font-bold uppercase text-void-400 block">
              Prize Pool
            </span>
            <p className="font-display font-black text-base sm:text-lg text-purple-highlight mt-0.5">
              ₹{match.prizeAmount}
            </p>
            {match.perKillPrize && (
              <span className="text-[8px] text-void-300">+₹{match.perKillPrize}/kill</span>
            )}
          </div>

          <div>
            <span className="text-[9px] font-display font-bold uppercase text-void-400 block">
              Entry Fee
            </span>
            <p className="font-display font-black text-base sm:text-lg text-void-100 mt-0.5">
              ₹{match.entryFee}
            </p>
            <span className="text-[8px] text-status-success font-medium">Verified Slot</span>
          </div>

          <div>
            <span className="text-[9px] font-display font-bold uppercase text-void-400 block">
              Start Time
            </span>
            <p className="font-display font-black text-xs text-void-200 mt-1 truncate">
              {match.matchTime}
            </p>
            <span className="text-[8px] text-void-400">{match.version}</span>
          </div>
        </div>
      </div>

      {/* Authoritative Room Credentials Card (Directive 5) */}
      <div className="rounded-2xl p-4 bg-void-850 border border-void-700/80 shadow-card-dark">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-void-800">
          <div className="flex items-center gap-1.5">
            {roomAccess.isUnlocked ? (
              <Unlock className="w-4 h-4 text-status-success" />
            ) : (
              <Lock className="w-4 h-4 text-purple-bright" />
            )}
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-void-100">
              Custom Room Credentials
            </h3>
          </div>
          <span
            className={`text-[9px] font-display font-bold uppercase px-2 py-0.5 rounded ${
              roomAccess.isUnlocked
                ? 'bg-status-success/20 text-status-success border border-status-success/40'
                : 'bg-void-750 text-void-400 border border-void-700'
            }`}
          >
            {roomAccess.isUnlocked ? 'ROOM UNLOCKED' : 'LOCKED'}
          </span>
        </div>

        {roomAccess.isUnlocked && roomAccess.credentials ? (
          <div className="space-y-2 mt-2">
            <div className="p-2.5 rounded-xl bg-void-900 border border-void-700 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-display uppercase tracking-wider text-void-400 block">
                  Room ID
                </span>
                <span className="font-mono font-bold text-sm text-purple-highlight">
                  {roomAccess.credentials.roomId}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(roomAccess.credentials!.roomId, 'roomId')}
                className="p-1.5 rounded-lg bg-void-800 hover:bg-void-700 text-void-300 hover:text-void-100 border border-void-700"
                aria-label="Copy Room ID"
              >
                {copiedField === 'roomId' ? (
                  <Check className="w-4 h-4 text-status-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-void-900 border border-void-700 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-display uppercase tracking-wider text-void-400 block">
                  Password
                </span>
                <span className="font-mono font-bold text-sm text-purple-highlight">
                  {roomAccess.credentials.roomPassword}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(roomAccess.credentials!.roomPassword, 'roomPass')}
                className="p-1.5 rounded-lg bg-void-800 hover:bg-void-700 text-void-300 hover:text-void-100 border border-void-700"
                aria-label="Copy Room Password"
              >
                {copiedField === 'roomPass' ? (
                  <Check className="w-4 h-4 text-status-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-void-900/80 border border-void-800 text-center">
            <p className="text-xs text-void-300 leading-relaxed">
              {roomAccess.eligibility.reason ||
                'Credentials unlock automatically 15 minutes before match start for confirmed slot holders.'}
            </p>
            {roomAccess.userHasConfirmedJoining && (
              <span className="inline-block mt-2 text-[10px] font-display font-bold text-status-success">
                ✓ Confirmed Slot Reserved on Your Account
              </span>
            )}
          </div>
        )}
      </div>

      {/* Prize Distribution Table */}
      <div className="rounded-2xl p-4 bg-void-850 border border-void-700/80 shadow-card-dark text-xs">
        <h3 className="font-display font-black text-xs uppercase tracking-wider text-void-100 mb-2.5 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-purple-bright" />
          <span>Prize Distribution</span>
        </h3>
        <div className="rounded-xl overflow-hidden border border-void-750 divide-y divide-void-800">
          <div className="grid grid-cols-2 p-2 bg-void-750 font-display font-bold text-void-300 text-[10px] uppercase">
            <span>Rank / Objective</span>
            <span className="text-right">Prize Amount</span>
          </div>
          {match.prizeDistribution.map((item, idx) => (
            <div key={idx} className="grid grid-cols-2 p-2 bg-void-900/60 text-[11px]">
              <span className="text-void-200">{item.rank}</span>
              <span className="text-right font-display font-bold text-purple-highlight">
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Match Rules */}
      <div className="rounded-2xl p-4 bg-void-850 border border-void-700/80 shadow-card-dark text-xs">
        <h3 className="font-display font-black text-xs uppercase tracking-wider text-void-100 mb-2.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>Official Match Rules</span>
        </h3>
        <ul className="space-y-2 text-[11px] text-void-300 list-disc list-inside leading-relaxed">
          {match.rules.map((rule) => (
            <li key={rule.id}>{rule.ruleText}</li>
          ))}
        </ul>
      </div>

      {/* Join Action CTA */}
      {!roomAccess.userHasConfirmedJoining && (
        <div className="pt-2 sticky bottom-14 z-30">
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-purple-md text-xs sm:text-sm font-black"
          >
            Select Slot & Join (₹{match.entryFee})
          </Button>
        </div>
      )}
    </div>
  );
}
