'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Swords, ArrowLeft, Save, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function EditMatchPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [contestId, setContestId] = useState('');
  const [status, setStatus] = useState('');
  const [title, setTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [teamType, setTeamType] = useState<'SOLO' | 'DUO' | 'SQUAD'>('SOLO');
  const [matchType, setMatchType] = useState('CLASSIC_CUSTOM');
  const [map, setMap] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [entryFee, setEntryFee] = useState<number | ''>(0);
  const [prizeAmount, setPrizeAmount] = useState<number | ''>(0);
  const [perKillPrize, setPerKillPrize] = useState<number | ''>('');
  const [version, setVersion] = useState('Mobile Only');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  // Prize Distribution Builder
  const [prizeDist, setPrizeDist] = useState<Array<{ rank: number; prize: number }>>([]);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!accessToken || !matchId) return;
      try {
        const res = await fetch(`/api/v1/admin/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const m = json.data;
          setContestId(m.contestId);
          setStatus(m.status);
          setTitle(m.title);
          setBannerImage(m.bannerImage);
          setGameMode(m.gameMode);
          setTeamType(m.teamType);
          setMatchType(m.matchType || 'CLASSIC_CUSTOM');
          setMap(m.map);
          setMatchDate(m.matchDate ? new Date(m.matchDate).toISOString().slice(0, 10) : '');
          setMatchTime(m.matchTime || '');
          setEntryFee(m.entryFee);
          setPrizeAmount(m.prizeAmount);
          setPerKillPrize(m.perKillPrize !== null ? m.perKillPrize : '');
          setVersion(m.version || 'Mobile Only');
          setRoomId(m.roomId || '');
          setRoomPassword(m.roomPassword || '');
          if (Array.isArray(m.prizeDistribution)) {
            setPrizeDist(m.prizeDistribution);
          }
        } else {
          setError(json.error?.message || 'Match not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load tournament.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [accessToken, matchId]);

  const handleAddPrizeTier = () => {
    const nextRank = prizeDist.length + 1;
    setPrizeDist([...prizeDist, { rank: nextRank, prize: 500 }]);
  };

  const handleRemovePrizeTier = (index: number) => {
    setPrizeDist(prizeDist.filter((_, idx) => idx !== index));
  };

  const handlePrizeChange = (index: number, field: 'rank' | 'prize', value: number) => {
    const updated = [...prizeDist];
    updated[index][field] = value;
    setPrizeDist(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const matchDateTime = matchDate ? new Date(`${matchDate}T19:30:00`).toISOString() : undefined;

    const payload = {
      title,
      bannerImage,
      gameMode,
      teamType,
      matchType,
      map,
      matchDate: matchDateTime,
      matchTime,
      entryFee: Number(entryFee),
      prizeAmount: Number(prizeAmount),
      perKillPrize: perKillPrize === '' ? null : Number(perKillPrize),
      version,
      roomId: roomId.trim() ? roomId.trim() : null,
      roomPassword: roomPassword.trim() ? roomPassword.trim() : null,
      prizeDistribution: prizeDist,
    };

    try {
      const res = await fetch(`/api/v1/admin/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setSuccess('Tournament parameters saved successfully.');
        setTimeout(() => {
          router.push(`/admin/matches/${matchId}`);
        }, 1200);
      } else {
        setError(json.error?.message || 'Failed to update tournament.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-purple-brand animate-spin" />
      </div>
    );
  }

  const isLocked = status === 'RESULTED' || status === 'CANCELLED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/matches/${matchId}`}
          className="p-2 bg-void-850 hover:bg-void-800 border border-void-700 rounded-xl text-void-300 hover:text-void-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-black text-void-100 uppercase tracking-tight">
              Edit Tournament Fixture
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase bg-purple-brand/20 text-purple-bright border border-purple-brand/40">
              {status}
            </span>
          </div>
          <p className="text-xs text-void-400 mt-0.5 font-mono">
            Contest ID: <span className="text-purple-bright">{contestId}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl text-status-error text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl text-status-success text-xs flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {isLocked && (
        <div className="p-4 bg-status-warning/10 border border-status-warning/30 rounded-xl text-status-warning text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>This match is {status}. Modifying parameters of finalized or cancelled tournaments is restricted.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details */}
        <div className="bg-void-900 border border-void-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-display font-bold uppercase text-void-200 border-b border-void-800 pb-3 flex items-center gap-2">
            <Swords className="w-4 h-4 text-purple-brand" />
            Tournament Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Fixture Title *
              </label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Banner Asset URL *
              </label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Game Mode *
              </label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Team Format *
              </label>
              <select
                disabled={isLocked}
                value={teamType}
                onChange={(e) => setTeamType(e.target.value as any)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              >
                <option value="SOLO">Solo (1 Player)</option>
                <option value="DUO">Duo (2 Players)</option>
                <option value="SQUAD">Squad (4 Players)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Battleground Map *
              </label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={map}
                onChange={(e) => setMap(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Hardware / Device Enforcement
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Room Credentials */}
        <div className="bg-void-900 border border-void-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-display font-bold uppercase text-void-200 border-b border-void-800 pb-3 flex items-center gap-2">
            <Swords className="w-4 h-4 text-purple-brand" />
            Schedule & Room Access
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Scheduled Date *
              </label>
              <input
                type="date"
                required
                disabled={isLocked}
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Scheduled Time Label *
              </label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-sans focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Custom Room ID
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. 9841284"
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Custom Room Password
              </label>
              <input
                type="text"
                disabled={isLocked}
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="e.g. VXA#88"
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Financial & Prize Distribution */}
        <div className="bg-void-900 border border-void-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-display font-bold uppercase text-void-200 border-b border-void-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-brand" />
            Financial & Prize Pool Structure
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Entry Fee (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={isLocked}
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Total Prize Pool (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                disabled={isLocked}
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider block mb-1">
                Per-Kill Bounty (₹)
              </label>
              <input
                type="number"
                min="0"
                disabled={isLocked}
                value={perKillPrize}
                onChange={(e) => setPerKillPrize(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Optional"
                className="w-full bg-void-950 border border-void-700 rounded-xl px-4 py-2.5 text-sm text-void-100 font-mono focus:border-purple-brand outline-none transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Prize Distribution Tiers */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono text-void-400 uppercase tracking-wider">
                Rank Prize Tiers
              </label>
              {!isLocked && (
                <button
                  type="button"
                  onClick={handleAddPrizeTier}
                  className="text-xs font-display font-bold text-purple-bright hover:underline"
                >
                  + Add Rank Tier
                </button>
              )}
            </div>

            <div className="space-y-2">
              {prizeDist.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-28">
                    <input
                      type="number"
                      min="1"
                      disabled={isLocked}
                      value={tier.rank}
                      onChange={(e) => handlePrizeChange(idx, 'rank', Number(e.target.value))}
                      className="w-full bg-void-950 border border-void-700 rounded-lg px-3 py-1.5 text-xs text-void-100 font-mono"
                      placeholder="Rank"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      disabled={isLocked}
                      value={tier.prize}
                      onChange={(e) => handlePrizeChange(idx, 'prize', Number(e.target.value))}
                      className="w-full bg-void-950 border border-void-700 rounded-lg px-3 py-1.5 text-xs text-void-100 font-mono"
                      placeholder="Prize Amount (₹)"
                    />
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemovePrizeTier(idx)}
                      className="text-void-400 hover:text-status-error text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-void-800">
          <Link
            href={`/admin/matches/${matchId}`}
            className="px-5 py-2.5 rounded-xl border border-void-700 text-void-300 hover:text-void-100 text-xs font-display font-bold uppercase transition-colors"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || isLocked}
            icon={submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {submitting ? 'Saving Changes...' : 'Save Parameters'}
          </Button>
        </div>
      </form>
    </div>
  );
}
