'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Swords,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Play,
  Key,
  XCircle,
  Trophy,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface MatchItem {
  id: string;
  contestId: string;
  title: string;
  bannerImage: string;
  gameMode: string;
  teamType: string;
  map: string;
  status: string;
  matchDate: string;
  matchTime: string;
  entryFee: number;
  prizeAmount: number;
  perKillPrize: number | null;
  totalSlots: number;
  filledSlots: number;
  confirmedPlayersCount: number;
  roomId?: string | null;
  roomPassword?: string | null;
  game: {
    name: string;
    badge?: string;
  };
}

export default function AdminMatchesPage() {
  const { accessToken } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Room pass modal
  const [credentialsModalMatch, setCredentialsModalMatch] = useState<MatchItem | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomPasswordInput, setRoomPasswordInput] = useState('');

  const fetchMatches = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/v1/admin/matches', window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (search.trim()) url.searchParams.set('search', search.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMatches(json.data.matches);
      } else {
        setError(json.error?.message || 'Failed to load matches.');
      }
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [accessToken, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches();
  };

  const handleTransitionStatus = async (matchId: string, newStatus: string) => {
    if (!accessToken) return;
    if (newStatus === 'CANCELLED' && !confirm('Are you sure you want to cancel this match? Confirmed entry fees will be queued for automated refund.')) {
      return;
    }

    setActionLoading(matchId);
    try {
      const res = await fetch(`/api/v1/admin/matches/${matchId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchMatches();
      } else {
        alert(json.error?.message || 'Action failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsModalMatch || !accessToken) return;

    try {
      const res = await fetch(`/api/v1/admin/matches/${credentialsModalMatch.id}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ roomId: roomIdInput, roomPassword: roomPasswordInput }),
      });
      const json = await res.json();
      if (json.success) {
        setCredentialsModalMatch(null);
        await fetchMatches();
      } else {
        alert(json.error?.message || 'Failed to save credentials.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating credentials');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
            Tournament Fixtures & Lifecycle
          </h1>
          <p className="text-xs text-void-400 mt-1">
            Authoritative match state transitions, room code distributions, and slot audits.
          </p>
        </div>

        <Button
          asAnchor
          href="/admin/matches/create"
          variant="primary"
          size="sm"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Create Match
        </Button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-void-900 p-3 rounded-2xl border border-void-700">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'UPCOMING', 'ONGOING', 'RESULTED', 'DRAFT', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold uppercase transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-purple-brand text-white shadow-purple-sm'
                  : 'text-void-300 hover:text-void-100 hover:bg-void-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-void-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID or title..."
              className="w-full bg-void-850 border border-void-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-void-100 placeholder-void-500 focus:outline-none focus:border-purple-brand"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-void-800 hover:bg-void-750 text-void-200 border border-void-700 rounded-xl text-xs font-display font-bold"
          >
            Find
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error">
          {error}
        </div>
      )}

      {/* Matches Table */}
      <div className="rounded-2xl bg-void-900 border border-void-700/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-void-700/80 bg-void-850/60 font-display font-bold text-void-400 uppercase tracking-wider">
                <th className="p-3.5 pl-5">Tournament</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Schedule</th>
                <th className="p-3.5">Slots Filled</th>
                <th className="p-3.5">Prizes</th>
                <th className="p-3.5">Room Pass</th>
                <th className="p-3.5 pr-5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-void-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-void-400 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-bright" />
                    Fetching Matches...
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-void-400 font-mono">
                    No tournament fixtures found matching criteria.
                  </td>
                </tr>
              ) : (
                matches.map((m) => (
                  <tr key={m.id} className="hover:bg-void-850/50 transition-colors">
                    {/* Title & Contest ID */}
                    <td className="p-3.5 pl-5">
                      <div className="font-display font-bold text-void-100 text-sm">
                        <Link href={`/admin/matches/${m.id}`} className="hover:text-purple-bright transition-colors">
                          {m.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-void-400">
                        <span className="text-purple-bright">{m.contestId}</span>
                        <span>•</span>
                        <span>{m.game.name}</span>
                        <span>•</span>
                        <span>{m.map}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider ${
                          m.status === 'ONGOING'
                            ? 'bg-status-warning/15 text-status-warning border border-status-warning/40 animate-pulse'
                            : m.status === 'UPCOMING'
                            ? 'bg-purple-brand/15 text-purple-bright border border-purple-brand/40'
                            : m.status === 'RESULTED'
                            ? 'bg-status-success/15 text-status-success border border-status-success/40'
                            : m.status === 'CANCELLED'
                            ? 'bg-status-error/15 text-status-error border border-status-error/40'
                            : 'bg-void-700/50 text-void-300 border border-void-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    {/* Schedule */}
                    <td className="p-3.5 font-mono text-[11px] text-void-300">
                      <div>{m.matchTime}</div>
                      <div className="text-void-400 text-[10px]">
                        {new Date(m.matchDate).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Slots */}
                    <td className="p-3.5 font-mono text-xs">
                      <div className="text-void-100 font-bold">
                        {m.confirmedPlayersCount} / {m.totalSlots}
                      </div>
                      <div className="text-[10px] text-void-400">
                        {Math.round((m.confirmedPlayersCount / m.totalSlots) * 100)}% Confirmed
                      </div>
                    </td>

                    {/* Prize Pool */}
                    <td className="p-3.5 font-mono text-xs">
                      <div className="text-status-gold font-bold">₹{m.prizeAmount.toLocaleString()}</div>
                      <div className="text-void-400 text-[10px]">Fee: ₹{m.entryFee}</div>
                    </td>

                    {/* Room Pass */}
                    <td className="p-3.5">
                      {m.roomId && m.roomPassword ? (
                        <div className="font-mono text-[11px] text-void-200">
                          <div>ID: <span className="text-purple-bright font-bold">{m.roomId}</span></div>
                          <div className="text-[10px] text-void-400">Pass: {m.roomPassword}</div>
                        </div>
                      ) : (
                        <span className="text-void-500 font-mono text-[10px]">Not Set</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Publish Draft to Upcoming */}
                        {m.status === 'DRAFT' && (
                          <button
                            onClick={() => handleTransitionStatus(m.id, 'UPCOMING')}
                            disabled={actionLoading === m.id}
                            className="px-2.5 py-1 bg-purple-brand/20 hover:bg-purple-brand text-purple-bright hover:text-white rounded-lg font-display font-bold text-[11px] uppercase transition-colors"
                          >
                            Publish
                          </button>
                        )}

                        {/* Start Match -> Ongoing */}
                        {m.status === 'UPCOMING' && (
                          <>
                            <button
                              onClick={() => {
                                setCredentialsModalMatch(m);
                                setRoomIdInput(m.roomId || '');
                                setRoomPasswordInput(m.roomPassword || '');
                              }}
                              className="px-2 py-1 bg-void-800 hover:bg-void-700 text-void-200 rounded-lg text-[11px] font-display font-bold uppercase flex items-center gap-1"
                              title="Set Room ID & Password"
                            >
                              <Key className="w-3 h-3" />
                              <span>Pass</span>
                            </button>
                            <button
                              onClick={() => handleTransitionStatus(m.id, 'ONGOING')}
                              disabled={actionLoading === m.id}
                              className="px-2.5 py-1 bg-status-warning/20 hover:bg-status-warning text-status-warning hover:text-black rounded-lg font-display font-bold text-[11px] uppercase transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              <span>Start</span>
                            </button>
                          </>
                        )}

                        {/* Ongoing -> Score Match */}
                        {m.status === 'ONGOING' && (
                          <Link
                            href={`/admin/results?matchId=${m.id}`}
                            className="px-2.5 py-1 bg-status-success/20 hover:bg-status-success text-status-success hover:text-black rounded-lg font-display font-bold text-[11px] uppercase transition-colors flex items-center gap-1"
                          >
                            <Trophy className="w-3 h-3" />
                            <span>Score</span>
                          </Link>
                        )}

                        {/* Cancel Match */}
                        {(m.status === 'UPCOMING' || m.status === 'ONGOING') && (
                          <button
                            onClick={() => handleTransitionStatus(m.id, 'CANCELLED')}
                            disabled={actionLoading === m.id}
                            className="p-1 text-void-400 hover:text-status-error hover:bg-void-800 rounded-lg transition-colors"
                            title="Cancel Tournament & Process Refunds"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Open Operational Breakdown */}
                        <Link
                          href={`/admin/matches/${m.id}`}
                          className="p-1 text-void-400 hover:text-white hover:bg-void-800 rounded-lg transition-colors"
                          title="View Operational Breakdown"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Credentials Modal */}
      {credentialsModalMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-void-900 border border-void-700 shadow-2xl">
            <h3 className="text-base font-display font-black text-void-100 uppercase mb-1">
              Broadcast Room Pass
            </h3>
            <p className="text-xs text-void-400 mb-4">
              Credentials will unlock automatically for confirmed contenders in <strong className="text-void-100">{credentialsModalMatch.title}</strong>.
            </p>

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Custom Room ID
                </label>
                <input
                  type="text"
                  required
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="e.g. 984120"
                  className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Room Password
                </label>
                <input
                  type="text"
                  required
                  value={roomPasswordInput}
                  onChange={(e) => setRoomPasswordInput(e.target.value)}
                  placeholder="e.g. 7788"
                  className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setCredentialsModalMatch(null)}
                  className="px-4 py-2 bg-void-800 hover:bg-void-750 text-void-300 rounded-xl text-xs font-display font-bold uppercase"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm">
                  Broadcast Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
