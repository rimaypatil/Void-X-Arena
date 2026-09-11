'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Swords,
  Users,
  Key,
  Play,
  XCircle,
  Trophy,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function AdminMatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;
  const { accessToken } = useAuth();

  const [match, setMatch] = useState<any | null>(null);
  const [slotsData, setSlotsData] = useState<any | null>(null);
  const [joinings, setJoinings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SLOTS' | 'PARTICIPANTS' | 'RULES'>('SLOTS');
  const [newRuleText, setNewRuleText] = useState('');
  const [savingRule, setSavingRule] = useState(false);

  // Room modal
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  const fetchMatchDetails = async () => {
    if (!accessToken || !matchId) return;
    setLoading(true);
    try {
      const [matchRes, slotsRes, joiningsRes] = await Promise.all([
        fetch(`/api/v1/admin/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`/api/v1/admin/matches/${matchId}/slots`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`/api/v1/admin/matches/${matchId}/joinings?status=CONFIRMED`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const matchJson = await matchRes.json();
      const slotsJson = await slotsRes.json();
      const joiningsJson = await joiningsRes.json();

      if (matchJson.success && matchJson.data) {
        setMatch(matchJson.data);
        setRoomId(matchJson.data.roomId || '');
        setRoomPassword(matchJson.data.roomPassword || '');
      }
      if (slotsJson.success && slotsJson.data) {
        setSlotsData(slotsJson.data);
      }
      if (joiningsJson.success && Array.isArray(joiningsJson.data?.joinings)) {
        setJoinings(joiningsJson.data.joinings);
      }
    } catch {
      // Handle network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId, accessToken]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim() || !accessToken) return;
    setSavingRule(true);
    try {
      const res = await fetch(`/api/v1/admin/matches/${matchId}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ruleText: newRuleText }),
      });
      const json = await res.json();
      if (json.success) {
        setNewRuleText('');
        await fetchMatchDetails();
      } else {
        alert(json.error?.message || 'Failed to add rule');
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!accessToken || !confirm('Delete this tournament rule?')) return;
    try {
      const res = await fetch(`/api/v1/admin/matches/${matchId}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success) {
        await fetchMatchDetails();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveRoomCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/v1/admin/matches/${matchId}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ roomId, roomPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setShowRoomModal(false);
        await fetchMatchDetails();
      } else {
        alert(json.error?.message || 'Failed to publish room credentials');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransitionStatus = async (newStatus: string) => {
    if (!accessToken) return;
    if (newStatus === 'CANCELLED' && !confirm('Are you sure you want to cancel this tournament? Automated refunds will be processed for all confirmed players.')) {
      return;
    }

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
        await fetchMatchDetails();
      } else {
        alert(json.error?.message || 'Status transition failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && !match) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-void-300">
        <RefreshCw className="w-8 h-8 text-purple-bright animate-spin mb-3" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading Tournament Operational State...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-8 text-center text-void-400 font-mono">
        Tournament fixture not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/matches"
            className="p-2 bg-void-850 hover:bg-void-800 border border-void-700 rounded-xl text-void-300 hover:text-void-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-display font-black text-void-100 uppercase tracking-tight">
                {match.title}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase bg-purple-brand/20 text-purple-bright border border-purple-brand/40">
                {match.status}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-void-400 mt-0.5">
              <span className="text-purple-bright">{match.contestId}</span>
              <span>•</span>
              <span>{match.game?.name}</span>
              <span>•</span>
              <span>{match.map}</span>
              <span>•</span>
              <span>{match.matchTime}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {match.status === 'UPCOMING' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRoomModal(true)}
                icon={<Key className="w-3.5 h-3.5" />}
              >
                Set Room Pass
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTransitionStatus('ONGOING')}
                icon={<Play className="w-3.5 h-3.5" />}
              >
                Start Match
              </Button>
            </>
          )}

          {match.status === 'ONGOING' && (
            <Button
              asAnchor
              href={`/admin/results?matchId=${match.id}`}
              variant="primary"
              size="sm"
              icon={<Trophy className="w-3.5 h-3.5" />}
            >
              Enter Match Results
            </Button>
          )}

          {(match.status === 'DRAFT' || match.status === 'UPCOMING') && (
            <Button
              asAnchor
              href={`/admin/matches/${match.id}/edit`}
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Edit Fixture
            </Button>
          )}

          {(match.status === 'UPCOMING' || match.status === 'ONGOING') && (
            <button
              onClick={() => handleTransitionStatus('CANCELLED')}
              className="p-2 text-void-400 hover:text-status-error hover:bg-void-850 rounded-lg transition-colors border border-void-700"
              title="Cancel Match with Automated Refunds"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-void-900 border border-void-700">
          <span className="text-[10px] font-display font-bold uppercase text-void-400 block">Slots Occupied</span>
          <span className="text-lg font-display font-black text-void-100">
            {slotsData?.metrics.occupiedSlots || 0} / {slotsData?.metrics.totalSlots || match.totalSlots}
          </span>
          <span className="text-[10px] font-mono text-purple-bright block">
            {slotsData?.metrics.fillPercentage || 0}% Filled
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-void-900 border border-void-700">
          <span className="text-[10px] font-display font-bold uppercase text-void-400 block">Confirmed Players</span>
          <span className="text-lg font-display font-black text-status-success">
            {joinings.length} Players
          </span>
          <span className="text-[10px] font-mono text-void-400 block">Strictly Confirmed</span>
        </div>

        <div className="p-3.5 rounded-xl bg-void-900 border border-void-700">
          <span className="text-[10px] font-display font-bold uppercase text-void-400 block">Prize Pool</span>
          <span className="text-lg font-display font-black text-status-gold">
            ₹{match.prizeAmount.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-void-400 block">
            Fee: ₹{match.entryFee} / Entry
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-void-900 border border-void-700">
          <span className="text-[10px] font-display font-bold uppercase text-void-400 block">Room Credentials</span>
          {match.roomId ? (
            <div className="text-xs font-mono text-void-100 font-bold mt-1">
              ID: <span className="text-purple-bright">{match.roomId}</span> (Pass: {match.roomPassword})
            </div>
          ) : (
            <span className="text-xs font-mono text-void-500 mt-1 block">Not Broadcast</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-void-700">
        {[
          { key: 'SLOTS', label: `Slot Grid (${slotsData?.slots.length || 0})` },
          { key: 'PARTICIPANTS', label: `Confirmed Contenders (${joinings.length})` },
          { key: 'RULES', label: `Match Rules (${match.rules?.length || 0})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 text-xs font-display font-bold uppercase border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-purple-brand text-purple-bright'
                : 'border-transparent text-void-400 hover:text-void-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SLOTS GRID */}
      {activeTab === 'SLOTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-void-400">
            <span>Authoritative visual slot matrix. Green = Occupied, Violet = Reserved, Gray = Available.</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-status-success inline-block" /> Occupied ({slotsData?.metrics.occupiedSlots || 0})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-brand inline-block" /> Reserved ({slotsData?.metrics.reservedSlots || 0})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-void-700 inline-block" /> Available ({slotsData?.metrics.availableSlots || 0})</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {slotsData?.slots.map((slot: any) => {
              const isOccupied = slot.status === 'OCCUPIED';
              const isReserved = slot.status === 'RESERVED' || slot.status === 'PAYMENT_PENDING';

              return (
                <div
                  key={slot.id}
                  className={`p-2 rounded-xl border text-center font-mono transition-colors ${
                    isOccupied
                      ? 'bg-status-success/15 border-status-success/40 text-status-success'
                      : isReserved
                      ? 'bg-purple-brand/15 border-purple-brand/40 text-purple-bright'
                      : 'bg-void-900 border-void-700/80 text-void-400'
                  }`}
                  title={
                    slot.reservedByUser
                      ? `Slot #${slot.slotNumber} (Team ${slot.teamNumber}): ${slot.reservedByUser.gameName || slot.reservedByUser.username}`
                      : `Slot #${slot.slotNumber} (Available)`
                  }
                >
                  <div className="text-[10px] text-void-500 uppercase">T{slot.teamNumber}</div>
                  <div className="text-sm font-bold my-0.5">#{slot.slotNumber}</div>
                  <div className="text-[9px] truncate">
                    {slot.reservedByUser ? slot.reservedByUser.gameName || slot.reservedByUser.username : 'Empty'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS TABLE */}
      {activeTab === 'PARTICIPANTS' && (
        <div className="rounded-2xl bg-void-900 border border-void-700/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-void-700/80 bg-void-850/60 font-display font-bold text-void-400 uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Team / Slot</th>
                  <th className="p-3.5">In-Game Name (IGN)</th>
                  <th className="p-3.5">Free Fire UID</th>
                  <th className="p-3.5">Account Username</th>
                  <th className="p-3.5">Amount Paid</th>
                  <th className="p-3.5 pr-5">Payment Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-void-800 font-sans">
                {joinings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-void-400 font-mono">
                      No confirmed participants yet.
                    </td>
                  </tr>
                ) : (
                  joinings.map((j) => (
                    <tr key={j.id} className="hover:bg-void-850/50 transition-colors">
                      <td className="p-3.5 pl-5 font-mono text-purple-bright font-bold">
                        Team {j.teamNumber} • Slot #{j.slotNumber}
                      </td>
                      <td className="p-3.5 font-display font-bold text-void-100">
                        {j.inGameName}
                      </td>
                      <td className="p-3.5 font-mono text-void-300">
                        {j.inGameId}
                      </td>
                      <td className="p-3.5 text-void-400">
                        {j.user?.username} ({j.user?.email})
                      </td>
                      <td className="p-3.5 font-mono text-status-success font-bold">
                        ₹{j.amountPaid}
                      </td>
                      <td className="p-3.5 pr-5 font-mono text-[11px] text-void-400">
                        {j.latestPayment?.orderId || 'Direct'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC RULES */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <form onSubmit={handleAddRule} className="flex items-center gap-2 bg-void-900 p-3 rounded-2xl border border-void-700">
            <input
              type="text"
              required
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              placeholder="Add new tournament rule (e.g. Gun properties OFF, Grenades allowed)..."
              className="flex-1 bg-void-850 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
            />
            <Button type="submit" variant="primary" size="sm" disabled={savingRule}>
              {savingRule ? 'Adding...' : 'Add Rule'}
            </Button>
          </form>

          <div className="rounded-2xl bg-void-900 border border-void-700/80 overflow-hidden divide-y divide-void-800">
            {match.rules?.map((rule: any, idx: number) => (
              <div key={rule.id} className="p-3.5 px-5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-purple-bright font-bold w-6">{idx + 1}.</span>
                  <span className="text-void-200">{rule.ruleText}</span>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-1.5 text-void-400 hover:text-status-error rounded-lg"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-void-900 border border-void-700 shadow-2xl">
            <h3 className="text-base font-display font-black text-void-100 uppercase mb-1">
              Broadcast Room Pass
            </h3>
            <p className="text-xs text-void-400 mb-4">
              Enter the Free Fire Custom Room ID and Password.
            </p>

            <form onSubmit={handleSaveRoomCredentials} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Custom Room ID
                </label>
                <input
                  type="text"
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
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
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="e.g. 7788"
                  className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 bg-void-800 hover:bg-void-750 text-void-300 rounded-xl text-xs font-display font-bold uppercase"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm">
                  Save Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
