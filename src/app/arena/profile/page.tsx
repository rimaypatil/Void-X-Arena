'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  ShieldCheck,
  Gamepad2,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Sparkles,
  Trophy,
  Skull,
  Award,
  Medal,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface UserStatistics {
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  totalEarnings: number;
  winRate: number;
  podiums: number;
}

export default function ArenaProfilePage() {
  const { user, accessToken, logout } = useAuth();
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoadingStats(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/v1/users/me/statistics', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      } catch {
        // Fallback silently
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [accessToken]);

  if (!user) {
    return (
      <div className="p-6 rounded-2xl bg-void-850 border border-void-700 text-center my-auto">
        <UserIcon className="w-12 h-12 text-purple-bright mx-auto mb-3 opacity-80" />
        <h3 className="font-display font-black text-base text-void-100 uppercase tracking-tight">
          Contender Authentication
        </h3>
        <p className="text-xs text-void-300 mt-1.5 mb-5 max-w-xs mx-auto leading-relaxed">
          Log in or register your Free Fire UID to join custom matches, receive room credentials, and manage your wallet.
        </p>
        <div className="flex flex-col gap-2.5">
          <Button asAnchor href="/arena/auth/login" variant="primary" size="md" className="w-full">
            Sign In
          </Button>
          <Button asAnchor href="/arena/auth/register" variant="outline" size="md" className="w-full">
            Create Contender Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Identity Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-void-800 via-void-850 to-void-900 border border-purple-brand/50 shadow-purple-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-brand to-purple-deep flex items-center justify-center text-white font-display font-black text-lg shadow-purple-sm shrink-0">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-black text-sm text-void-100 uppercase truncate">
                {user.username}
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-purple-brand/20 text-purple-bright text-[9px] font-display font-bold">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-void-300 truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Free Fire In-Game UID Pill */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-void-900/90 border border-void-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-purple-bright" />
            <div>
              <span className="text-[8px] font-display uppercase tracking-wider text-void-400 block">
                Free Fire UID & IGN
              </span>
              <span className="font-display font-bold text-void-100 text-xs">
                {user.gameName || 'Not Set'} ({user.gameUid || 'No UID'})
              </span>
            </div>
          </div>
          <span className="text-[9px] text-purple-bright font-display font-bold uppercase">
            VERIFIED
          </span>
        </div>
      </div>

      {/* Authoritative Esports Statistics Card */}
      <div className="p-3.5 rounded-2xl bg-void-850 border border-void-700/80 shadow-card-dark">
        <div className="flex items-center justify-between border-b border-void-800 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-purple-bright" />
            <h4 className="font-display font-black text-xs uppercase tracking-wider text-void-100">
              Tournament Career Record
            </h4>
          </div>
          <span className="text-[9px] font-display font-bold uppercase text-status-success bg-status-success/15 px-2 py-0.5 rounded border border-status-success/30">
            VERIFIED STATS
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-void-900 border border-void-750">
            <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
              Matches
            </span>
            <p className="font-display font-black text-sm text-void-100 mt-0.5 font-mono">
              {stats?.totalMatches ?? 0}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-void-900 border border-void-750">
            <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
              Booyahs (Wins)
            </span>
            <p className="font-display font-black text-sm text-status-warning mt-0.5 font-mono">
              {stats?.totalWins ?? 0}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-void-900 border border-void-750">
            <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
              Verified Kills
            </span>
            <p className="font-display font-black text-sm text-status-danger mt-0.5 font-mono">
              {stats?.totalKills ?? 0}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-void-900 border border-void-750">
            <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
              Win Rate
            </span>
            <p className="font-display font-black text-sm text-purple-bright mt-0.5 font-mono">
              {stats?.winRate ?? 0}%
            </p>
          </div>

          <div className="p-2 rounded-xl bg-void-900 border border-void-750">
            <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
              Podium Finishes
            </span>
            <p className="font-display font-black text-sm text-void-200 mt-0.5 font-mono">
              {stats?.podiums ?? 0}
            </p>
          </div>

          <div className="p-2 rounded-xl bg-void-900 border border-void-750">
            <span className="text-[8px] font-display font-bold uppercase text-void-400 block">
              Total Earnings
            </span>
            <p className="font-display font-black text-sm text-status-success mt-0.5 font-mono">
              ₹{(stats?.totalEarnings ?? 0).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Menu Section (Directive 3) */}
      <div className="rounded-xl bg-void-850 border border-void-700/80 overflow-hidden divide-y divide-void-800 text-xs">
        <Link
          href="/#how-it-works"
          className="p-3 flex items-center justify-between hover:bg-void-800/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-purple-bright" />
            <span className="font-display font-bold text-void-200">Fair Play & Anti-Cheat Rules</span>
          </div>
          <ChevronRight className="w-4 h-4 text-void-400" />
        </Link>

        <Link
          href="/#faq"
          className="p-3 flex items-center justify-between hover:bg-void-800/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-purple-bright" />
            <span className="font-display font-bold text-void-200">Help & Room ID Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-void-400" />
        </Link>

        <Link
          href="/#contact"
          className="p-3 flex items-center justify-between hover:bg-void-800/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-purple-bright" />
            <span className="font-display font-bold text-void-200">Terms & Tournament Regulations</span>
          </div>
          <ChevronRight className="w-4 h-4 text-void-400" />
        </Link>
      </div>

      {/* APK Client Versioning Card */}
      <div className="p-3 rounded-xl bg-void-900 border border-void-800 flex items-center justify-between text-[11px] text-void-400">
        <span>Void X Client v1.0.0 (Release)</span>
        <span className="text-status-success font-display font-bold">Latest Build</span>
      </div>

      {/* Logout Action */}
      <Button
        variant="danger"
        size="md"
        icon={<LogOut className="w-4 h-4" />}
        onClick={logout}
        className="w-full text-xs"
      >
        Sign Out
      </Button>
    </div>
  );
}
