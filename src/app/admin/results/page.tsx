'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  Swords,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit2,
  ShieldCheck,
  Save,
  Send,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface MatchOption {
  id: string;
  contestId: string;
  title: string;
  status: string;
  prizeAmount: number;
  perKillPrize: number | null;
  prizeDistribution: any;
  confirmedPlayersCount: number;
}

interface ParticipantScore {
  joiningId: string;
  userId: string;
  inGameName: string;
  inGameId: string;
  teamNumber: number;
  slotNumber: number;
  rank: number;
  kills: number;
}

export default function AdminResultsScoringPage() {
  const searchParams = useSearchParams();
  const preselectedMatchId = searchParams.get('matchId') || '';
  const { accessToken } = useAuth();

  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState(preselectedMatchId);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [participants, setParticipants] = useState<ParticipantScore[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Correction Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');

  // Fetch matches eligible for scoring (ONGOING and RESULTED)
  useEffect(() => {
    const fetchMatches = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('/api/v1/admin/matches?limit=50', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.matches)) {
          const eligible = json.data.matches.filter(
            (m: any) => m.status === 'ONGOING' || m.status === 'RESULTED'
          );
          setMatches(eligible);
          if (!selectedMatchId && eligible.length > 0) {
            setSelectedMatchId(eligible[0].id);
          }
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [accessToken]);

  // When selectedMatchId changes, fetch match details, joinings, and any existing draft/result
  useEffect(() => {
    const fetchMatchState = async () => {
      if (!selectedMatchId || !accessToken) return;
      setLoading(true);
      setMessage(null);
      try {
        const [matchRes, joiningsRes] = await Promise.all([
          fetch(`/api/v1/admin/matches/${selectedMatchId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`/api/v1/admin/matches/${selectedMatchId}/joinings?status=CONFIRMED`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const matchJson = await matchRes.json();
        const joiningsJson = await joiningsRes.json();

        if (matchJson.success && matchJson.data) {
          setSelectedMatch(matchJson.data);

          const existingPlayers = matchJson.data.result?.players || [];
          const existingSummary = matchJson.data.result?.summary || '';
          setSummary(existingSummary);

          // Build participant scoring rows
          if (joiningsJson.success && Array.isArray(joiningsJson.data?.joinings)) {
            const confirmedList = joiningsJson.data.joinings;

            const scores: ParticipantScore[] = confirmedList.map((j: any, idx: number) => {
              const matched = existingPlayers.find((p: any) => p.joiningId === j.id || p.userId === j.user?.id);
              return {
                joiningId: j.id,
                userId: j.user?.id,
                inGameName: j.inGameName,
                inGameId: j.inGameId,
                teamNumber: j.teamNumber,
                slotNumber: j.slotNumber,
                rank: matched ? matched.rank : idx + 1,
                kills: matched ? matched.kills : 0,
              };
            });

            // Sort by rank
            scores.sort((a, b) => a.rank - b.rank);
            setParticipants(scores);
          }
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load match participants.' });
      } finally {
        setLoading(false);
      }
    };

    fetchMatchState();
  }, [selectedMatchId, accessToken]);

  const handleScoreChange = (joiningId: string, field: 'rank' | 'kills', value: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.joiningId === joiningId ? { ...p, [field]: value } : p))
    );
  };

  // Live client settlement preview calculation
  const calculatePreview = () => {
    if (!selectedMatch) return { totalPayout: 0, previewRows: [] };

    // Parse prize distribution
    const prizeMap = new Map<number, number>();
    const rawDist = selectedMatch.prizeDistribution;
    if (Array.isArray(rawDist)) {
      for (const item of rawDist) {
        const r = typeof item.rank === 'number' ? item.rank : parseInt(String(item.rank).replace(/\D/g, ''), 10);
        const p = typeof item.prize === 'number' ? item.prize : parseFloat(String(item.amount || item.prize).replace(/[^0-9.]/g, ''));
        if (!isNaN(r) && !isNaN(p)) prizeMap.set(r, p);
      }
    }

    const perKill = Number(selectedMatch.perKillPrize || 0);
    let totalPayout = 0;

    const previewRows = participants.map((p) => {
      const placementPrize = prizeMap.get(p.rank) || 0;
      const killPrize = Number((perKill * p.kills).toFixed(2));
      const total = Number((placementPrize + killPrize).toFixed(2));
      totalPayout += total;

      return {
        ...p,
        placementPrize,
        killPrize,
        total,
      };
    });

    return {
      totalPayout: Number(totalPayout.toFixed(2)),
      previewRows,
      maxPrizePool: Number(selectedMatch.prizeAmount),
    };
  };

  const preview = calculatePreview();
  const isPrizeExceeded = preview.totalPayout > (preview.maxPrizePool || 0) + 0.01;

  // Save Draft
  const handleSaveDraft = async () => {
    if (!accessToken || !selectedMatchId) return;
    setSavingDraft(true);
    setMessage(null);

    const payload = {
      players: participants.map((p) => ({
        joiningId: p.joiningId,
        rank: Number(p.rank),
        kills: Number(p.kills),
      })),
      summary,
    };

    try {
      const res = await fetch(`/api/v1/admin/matches/${selectedMatchId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Result draft saved. Zero financial impact on contender wallets.' });
      } else {
        setMessage({ type: 'error', text: json.error?.message || 'Failed to save draft.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingDraft(false);
    }
  };

  // Publish Official Result
  const handlePublish = async () => {
    if (!accessToken || !selectedMatchId) return;
    if (isPrizeExceeded) {
      alert(`Cannot publish: Total payout (₹${preview.totalPayout}) exceeds prize pool (₹${preview.maxPrizePool}).`);
      return;
    }
    if (!confirm('PUBLISH OFFICIAL RESULTS?\n\nThis will trigger authoritative prize distribution directly to contender wallet winning balances and finalize the match status as RESULTED.')) {
      return;
    }

    setPublishing(true);
    setMessage(null);

    const payload = {
      players: participants.map((p) => ({
        joiningId: p.joiningId,
        rank: Number(p.rank),
        kills: Number(p.kills),
      })),
      summary,
    };

    try {
      const res = await fetch(`/api/v1/admin/matches/${selectedMatchId}/results/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({
          type: 'success',
          text: 'Official tournament results published! Prizes settled to winner winning balances and recorded in immutable ledger.',
        });
        // Refresh match state
        const ref = await fetch(`/api/v1/admin/matches/${selectedMatchId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const refJson = await ref.json();
        if (refJson.success) setSelectedMatch(refJson.data);
      } else {
        setMessage({ type: 'error', text: json.error?.message || 'Failed to publish results.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  // Administrative Correction
  const handleCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedMatchId || !correctionReason.trim()) return;

    try {
      const payload = {
        reason: correctionReason,
        players: participants.map((p) => ({
          joiningId: p.joiningId,
          rank: Number(p.rank),
          kills: Number(p.kills),
        })),
        summary,
      };

      const res = await fetch(`/api/v1/admin/matches/${selectedMatchId}/results/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setCorrectionModalOpen(false);
        setCorrectionReason('');
        setMessage({
          type: 'success',
          text: 'Results corrected. Compensating ADJUSTMENT ledger transactions recorded.',
        });
      } else {
        alert(json.error?.message || 'Correction failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Match Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
            Referee Scoring Workbench
          </h1>
          <p className="text-xs text-void-400 mt-1">
            Authoritative placement scoring, automated kill bounty calculations, and instant wallet prize settlement.
          </p>
        </div>

        {/* Match Select Dropdown */}
        <div className="w-full sm:w-72">
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full bg-void-900 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand font-display font-bold uppercase"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.status}] {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-error/10 border-status-error/30 text-status-error'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {selectedMatch && (
        <>
          {/* Match Status Banner */}
          <div className="p-4 rounded-2xl bg-void-900 border border-void-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-brand/20 border border-purple-brand/40 flex items-center justify-center text-purple-bright shadow-purple-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-base text-void-100 uppercase">
                    {selectedMatch.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-display font-bold uppercase bg-void-800 border border-void-600 text-purple-bright">
                    {selectedMatch.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-void-400 mt-0.5">
                  Prize Pool: <strong className="text-status-gold">₹{selectedMatch.prizeAmount.toLocaleString()}</strong> • Kill Bounty: <strong className="text-void-200">₹{selectedMatch.perKillPrize || 0}/kill</strong>
                </div>
              </div>
            </div>

            {/* Current Result Publication State */}
            <div className="flex items-center gap-2">
              {selectedMatch.result?.status === 'PUBLISHED' ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-status-success/15 border border-status-success/40 text-status-success font-display font-bold text-[11px] uppercase">
                    Official Results Published
                  </span>
                  <button
                    onClick={() => setCorrectionModalOpen(true)}
                    className="px-2.5 py-1 bg-void-800 hover:bg-void-750 text-void-200 rounded-lg text-[11px] font-display font-bold uppercase border border-void-700 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Correct</span>
                  </button>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-status-warning/15 border border-status-warning/40 text-status-warning font-display font-bold text-[11px] uppercase">
                  Scoring In Progress (Draft Mode)
                </span>
              )}
            </div>
          </div>

          {/* Scoring Table */}
          <div className="rounded-2xl bg-void-900 border border-void-700/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-void-700/80 flex items-center justify-between">
              <span className="text-xs font-display font-bold uppercase text-void-300">
                Confirmed Tournament Contenders ({participants.length})
              </span>
              <span className="text-[11px] font-mono text-void-400">
                Server authoritative: Ranks & Kills dynamically calculate placement and bounties
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-void-700/80 bg-void-850/60 font-display font-bold text-void-400 uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Placement Rank</th>
                    <th className="p-3.5">Contender (IGN)</th>
                    <th className="p-3.5">Free Fire UID</th>
                    <th className="p-3.5">Kills</th>
                    <th className="p-3.5">Placement Prize</th>
                    <th className="p-3.5">Kill Prize</th>
                    <th className="p-3.5 pr-5 font-bold text-void-200">Total Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-void-800 font-sans">
                  {participants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-void-400 font-mono">
                        No confirmed contenders in this match.
                      </td>
                    </tr>
                  ) : (
                    preview.previewRows.map((row) => (
                      <tr key={row.joiningId} className="hover:bg-void-850/50 transition-colors">
                        {/* Rank Input */}
                        <td className="p-3.5 pl-5">
                          <input
                            type="number"
                            min={1}
                            max={participants.length}
                            value={row.rank}
                            onChange={(e) => handleScoreChange(row.joiningId, 'rank', parseInt(e.target.value, 10))}
                            className="w-16 bg-void-800 border border-void-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-void-100 text-center focus:outline-none focus:border-purple-brand"
                          />
                        </td>

                        {/* Contender IGN */}
                        <td className="p-3.5 font-display font-bold text-void-100">
                          {row.inGameName}
                        </td>

                        {/* FF UID */}
                        <td className="p-3.5 font-mono text-void-400">
                          {row.inGameId}
                        </td>

                        {/* Kills Input */}
                        <td className="p-3.5">
                          <input
                            type="number"
                            min={0}
                            value={row.kills}
                            onChange={(e) => handleScoreChange(row.joiningId, 'kills', parseInt(e.target.value, 10))}
                            className="w-16 bg-void-800 border border-void-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-void-100 text-center focus:outline-none focus:border-purple-brand"
                          />
                        </td>

                        {/* Placement Prize */}
                        <td className="p-3.5 font-mono text-void-300">
                          ₹{row.placementPrize.toLocaleString()}
                        </td>

                        {/* Kill Bounty */}
                        <td className="p-3.5 font-mono text-void-400">
                          ₹{row.killPrize.toLocaleString()}
                        </td>

                        {/* Total Settlement */}
                        <td className="p-3.5 pr-5 font-mono font-bold text-status-gold text-sm">
                          ₹{row.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Live Settlement Preview Summary Bar */}
            <div className="p-4 bg-void-850 border-t border-void-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-void-400 text-[10px] block uppercase">Total Payout Calculated:</span>
                  <span className={`text-base font-bold ${isPrizeExceeded ? 'text-status-error' : 'text-status-gold'}`}>
                    ₹{preview.totalPayout.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-void-400 text-[10px] block uppercase">Match Prize Pool:</span>
                  <span className="text-base font-bold text-void-200">
                    ₹{(preview.maxPrizePool || 0).toLocaleString()}
                  </span>
                </div>
                {isPrizeExceeded && (
                  <div className="text-status-error text-xs flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Payout exceeds match pool!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <Button
                  onClick={handleSaveDraft}
                  disabled={savingDraft || participants.length === 0}
                  variant="outline"
                  size="sm"
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  {savingDraft ? 'Saving...' : 'Save Draft'}
                </Button>

                <Button
                  onClick={handlePublish}
                  disabled={publishing || isPrizeExceeded || participants.length === 0}
                  variant="primary"
                  size="sm"
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  {publishing ? 'Settling Winnings...' : 'Publish Official Results'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Administrative Correction Modal */}
      {correctionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-void-900 border border-void-700 shadow-2xl">
            <h3 className="text-base font-display font-black text-void-100 uppercase mb-1">
              Administrative Result Correction
            </h3>
            <p className="text-xs text-void-400 mb-4">
              A detailed explanatory reason is mandatory. Compensating ADJUSTMENT transactions will be generated in the wallet ledger without overwriting past entries.
            </p>

            <form onSubmit={handleCorrection} className="space-y-4">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Correction Reason (Mandatory)
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Video replay review confirmed 3 additional sniper kills for Player B in Final Zone..."
                  className="w-full bg-void-800 border border-void-700 rounded-xl p-3 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 bg-void-800 hover:bg-void-750 text-void-300 rounded-xl text-xs font-display font-bold uppercase"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm">
                  Apply Compensating Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
