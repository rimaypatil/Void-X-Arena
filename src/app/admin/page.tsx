'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Swords,
  Trophy,
  CreditCard,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface DashboardData {
  matches: {
    total: number;
    upcoming: number;
    ongoing: number;
    resulted: number;
    cancelled: number;
    pendingResults: number;
  };
  players: {
    total: number;
    confirmedJoinings: number;
  };
  financials: {
    totalRevenue: number;
    totalPrizesDistributed: number;
    netPlatformMargin: number;
    pendingPaymentsCount: number;
    pendingRefundsCount: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actor: string;
    actorRole: string;
    details: any;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to load operational statistics.');
      }
    } catch {
      setError('Unable to reach tournament control servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [accessToken]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-void-300">
        <RefreshCw className="w-8 h-8 text-purple-bright animate-spin mb-3" />
        <span className="text-xs font-mono uppercase tracking-wider">Aggregating PostgreSQL Metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
            Tournament Operations Dashboard
          </h1>
          <p className="text-xs text-void-400 mt-1 font-sans">
            Authoritative platform health, real-time match queues, and financial ledger status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asAnchor
            href="/admin/matches/create"
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Create Tournament
          </Button>
          <Button
            asAnchor
            href="/admin/results"
            variant="outline"
            size="sm"
            icon={<Trophy className="w-3.5 h-3.5" />}
          >
            Score Matches
          </Button>
          <button
            onClick={fetchSummary}
            className="p-2 bg-void-850 hover:bg-void-800 border border-void-700 rounded-lg text-void-300 hover:text-white transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Match Queues */}
        <div className="p-4 rounded-2xl bg-void-900 border border-void-700/80 shadow-lg">
          <div className="flex items-center justify-between text-void-400 mb-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider">Tournament Fixtures</span>
            <Swords className="w-4 h-4 text-purple-bright" />
          </div>
          <div className="text-2xl font-display font-black text-void-100">
            {data?.matches.total || 0}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-void-400">
            <span className="text-status-warning font-bold">{data?.matches.ongoing || 0} Ongoing</span>
            <span>•</span>
            <span className="text-purple-bright font-bold">{data?.matches.upcoming || 0} Upcoming</span>
            <span>•</span>
            <span className="text-status-success">{data?.matches.resulted || 0} Resulted</span>
          </div>
        </div>

        {/* Card 2: Registered Contenders */}
        <div className="p-4 rounded-2xl bg-void-900 border border-void-700/80 shadow-lg">
          <div className="flex items-center justify-between text-void-400 mb-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider">Contenders</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-display font-black text-void-100">
            {data?.players.total || 0}
          </div>
          <div className="mt-2 text-[11px] font-mono text-void-400">
            <span className="text-void-200 font-bold">{data?.players.confirmedJoinings || 0}</span> confirmed registrations
          </div>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="p-4 rounded-2xl bg-void-900 border border-void-700/80 shadow-lg">
          <div className="flex items-center justify-between text-void-400 mb-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider">Gross Revenue</span>
            <CreditCard className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-2xl font-display font-black text-void-100">
            ₹{(data?.financials.totalRevenue || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] font-mono text-void-400 flex items-center gap-1.5">
            <span>Margin:</span>
            <strong className="text-status-success">₹{(data?.financials.netPlatformMargin || 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* Card 4: Prizes Distributed */}
        <div className="p-4 rounded-2xl bg-void-900 border border-void-700/80 shadow-lg">
          <div className="flex items-center justify-between text-void-400 mb-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider">Prizes Settled</span>
            <Trophy className="w-4 h-4 text-status-gold" />
          </div>
          <div className="text-2xl font-display font-black text-void-100">
            ₹{(data?.financials.totalPrizesDistributed || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] font-mono text-void-400">
            Settled strictly to winner winning balances
          </div>
        </div>
      </div>

      {/* Operational Attention Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/results"
          className="p-4 rounded-2xl bg-void-900 hover:bg-void-850 border border-void-700 flex items-center justify-between group transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-status-warning/10 border border-status-warning/30 flex items-center justify-center text-status-warning">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-display font-bold text-void-100 uppercase">
                Pending Match Results
              </div>
              <div className="text-[11px] font-mono text-void-400">
                {data?.matches.pendingResults || 0} matches awaiting referee scoring
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-void-400 group-hover:text-purple-bright group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/admin/payments"
          className="p-4 rounded-2xl bg-void-900 hover:bg-void-850 border border-void-700 flex items-center justify-between group transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-brand/10 border border-purple-brand/30 flex items-center justify-center text-purple-bright">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-display font-bold text-void-100 uppercase">
                Payment Reconciliations
              </div>
              <div className="text-[11px] font-mono text-void-400">
                {data?.financials.pendingPaymentsCount || 0} pending gateway intents
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-void-400 group-hover:text-purple-bright group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/admin/payments?tab=REFUNDS"
          className="p-4 rounded-2xl bg-void-900 hover:bg-void-850 border border-void-700 flex items-center justify-between group transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-display font-bold text-void-100 uppercase">
                Pending Refunds
              </div>
              <div className="text-[11px] font-mono text-void-400">
                {data?.financials.pendingRefundsCount || 0} refunds to be reconciled
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-void-400 group-hover:text-purple-bright group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Recent Audit Trail Stream */}
      <div className="rounded-2xl bg-void-900 border border-void-700/80 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-void-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-bright" />
            <h3 className="text-xs font-display font-black text-void-100 uppercase tracking-wider">
              Recent Administrative Audit Trail
            </h3>
          </div>
          <Link
            href="/admin/audit"
            className="text-[11px] font-display font-bold text-purple-bright hover:underline uppercase"
          >
            View All Logs →
          </Link>
        </div>

        <div className="divide-y divide-void-800">
          {(!data?.recentActivity || data.recentActivity.length === 0) ? (
            <div className="p-6 text-center text-xs text-void-400 font-mono">
              No audit events recorded yet.
            </div>
          ) : (
            data.recentActivity.map((log) => (
              <div key={log.id} className="p-3.5 px-5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-void-800 border border-void-700 font-mono text-[10px] text-purple-bright font-bold uppercase shrink-0">
                    {log.action}
                  </span>
                  <div className="min-w-0 truncate">
                    <span className="font-display font-bold text-void-200">
                      {log.actor}
                    </span>
                    <span className="text-void-400 text-[11px] ml-2">
                      on {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-void-400 shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
