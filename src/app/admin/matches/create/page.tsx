'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Swords, ArrowLeft, PlusCircle, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function CreateMatchPage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [games, setGames] = useState<Array<{ id: string; name: string; gameMode: string; playerCount: number }>>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [gameId, setGameId] = useState('');
  const [contestId, setContestId] = useState(`VXA-FF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('/assets/images/freefire/battle-royale.jpg');
  const [gameMode, setGameMode] = useState('BATTLE_ROYALE_SQUAD');
  const [teamType, setTeamType] = useState<'SOLO' | 'DUO' | 'SQUAD'>('SQUAD');
  const [map, setMap] = useState('Bermuda');
  const [matchDate, setMatchDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [matchTime, setMatchTime] = useState('08:00 PM IST');
  const [entryFee, setEntryFee] = useState(50);
  const [prizeAmount, setPrizeAmount] = useState(15000);
  const [perKillPrize, setPerKillPrize] = useState<number | ''>(25);
  const [totalSlots, setTotalSlots] = useState(48);

  // Prize Distribution Builder
  const [prizeDist, setPrizeDist] = useState<Array<{ rank: number; prize: number }>>([
    { rank: 1, prize: 7500 },
    { rank: 2, prize: 4000 },
    { rank: 3, prize: 2000 },
  ]);

  // Dynamic Rules
  const [rules, setRules] = useState<string[]>([
    'Mobile devices strictly only. Emulators will be instantly disqualified.',
    'Room credentials unlock automatically inside the app 15 minutes before match start.',
    'All participants must use verified in-game IDs submitted during registration.',
    'Strict zero-tolerance anti-cheat policy with referee match logging.',
  ]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/v1/admin/games', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setGames(json.data);
          if (json.data.length > 0) {
            setGameId(json.data[0].id);
            setGameMode(json.data[0].gameMode);
            setTotalSlots(json.data[0].playerCount);
          }
        }
      } catch {
        setError('Failed to fetch esports games.');
      } finally {
        setLoadingGames(false);
      }
    };

    if (accessToken) fetchGames();
  }, [accessToken]);

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

  const handleAddRule = () => {
    setRules([...rules, '']);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleRuleChange = (index: number, text: string) => {
    const updated = [...rules];
    updated[index] = text;
    setRules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setSubmitting(true);
    setError(null);

    const matchDateTime = new Date(`${matchDate}T19:30:00`);
    const regStart = new Date(Date.now() - 3600000);
    const regEnd = matchDateTime;

    const payload = {
      contestId,
      title,
      bannerImage,
      gameId,
      gameMode,
      teamType,
      matchType: 'CLASSIC_CUSTOM',
      map,
      matchDate: matchDateTime.toISOString(),
      matchTime,
      registrationStart: regStart.toISOString(),
      registrationEnd: regEnd.toISOString(),
      entryFee: Number(entryFee),
      prizeAmount: Number(prizeAmount),
      perKillPrize: perKillPrize === '' ? null : Number(perKillPrize),
      totalSlots: Number(totalSlots),
      prizeDistribution: prizeDist,
      rules: rules.filter((r) => r.trim().length > 0).map((ruleText, idx) => ({
        ruleText,
        displayOrder: idx + 1,
      })),
    };

    try {
      const res = await fetch('/api/v1/admin/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        router.push('/admin/matches');
      } else {
        setError(json.error?.message || 'Failed to create match.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/matches"
          className="p-2 bg-void-850 hover:bg-void-800 border border-void-700 rounded-xl text-void-300 hover:text-void-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-display font-black text-void-100 uppercase tracking-tight">
            Create Tournament Fixture
          </h1>
          <p className="text-xs text-void-400 mt-0.5">
            Initializes real individual slot records and establishes authoritative prize distribution rules.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Game & Title */}
        <div className="p-5 rounded-2xl bg-void-900 border border-void-700/80 space-y-4 shadow-xl">
          <h3 className="text-xs font-display font-black text-purple-bright uppercase tracking-wider">
            1. Esports Game & Basic Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Esports Game
              </label>
              {loadingGames ? (
                <div className="text-xs text-void-400 font-mono py-2">Loading games...</div>
              ) : (
                <select
                  value={gameId}
                  onChange={(e) => {
                    setGameId(e.target.value);
                    const selected = games.find((g) => g.id === e.target.value);
                    if (selected) {
                      setGameMode(selected.gameMode);
                      setTotalSlots(selected.playerCount);
                    }
                  }}
                  className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.gameMode})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Contest ID (Unique Code)
              </label>
              <input
                type="text"
                required
                value={contestId}
                onChange={(e) => setContestId(e.target.value)}
                placeholder="e.g. VXA-FF-001"
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Tournament Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bermuda Squad Bloodbath #44"
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Map
              </label>
              <input
                type="text"
                required
                value={map}
                onChange={(e) => setMap(e.target.value)}
                placeholder="e.g. Bermuda, Purgatory, Kalahari"
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Team Type
              </label>
              <select
                value={teamType}
                onChange={(e) => setTeamType(e.target.value as any)}
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
              >
                <option value="SOLO">Solo (1 per slot)</option>
                <option value="DUO">Duo (2 per team)</option>
                <option value="SQUAD">Squad (4 per team)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Total Slots
              </label>
              <input
                type="number"
                required
                min={2}
                max={100}
                value={totalSlots}
                onChange={(e) => setTotalSlots(parseInt(e.target.value, 10))}
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Banner Image URL
              </label>
              <input
                type="text"
                required
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Timing & Schedule */}
        <div className="p-5 rounded-2xl bg-void-900 border border-void-700/80 space-y-4 shadow-xl">
          <h3 className="text-xs font-display font-black text-purple-bright uppercase tracking-wider">
            2. Match Timing & Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Match Date
              </label>
              <input
                type="date"
                required
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Display Match Time
              </label>
              <input
                type="text"
                required
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                placeholder="e.g. 08:30 PM IST"
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financials & Prize Distribution */}
        <div className="p-5 rounded-2xl bg-void-900 border border-void-700/80 space-y-4 shadow-xl">
          <h3 className="text-xs font-display font-black text-purple-bright uppercase tracking-wider">
            3. Entry Fee & Prize Pool Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={entryFee}
                onChange={(e) => setEntryFee(parseFloat(e.target.value))}
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Total Prize Pool (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(parseFloat(e.target.value))}
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                Per Kill Bounty (₹) (Optional)
              </label>
              <input
                type="number"
                min={0}
                value={perKillPrize}
                onChange={(e) => setPerKillPrize(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 25"
                className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
              />
            </div>
          </div>

          {/* Placement Prize Tiers */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-display font-bold uppercase text-void-300">
                Placement Prize Tiers
              </span>
              <button
                type="button"
                onClick={handleAddPrizeTier}
                className="text-[11px] font-display font-bold text-purple-bright hover:underline uppercase flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Rank Tier</span>
              </button>
            </div>

            <div className="space-y-2">
              {prizeDist.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-void-400 w-16">Rank #{tier.rank}</span>
                  <input
                    type="number"
                    min={0}
                    value={tier.prize}
                    onChange={(e) => handlePrizeChange(idx, 'prize', parseFloat(e.target.value))}
                    className="flex-1 bg-void-800 border border-void-700 rounded-xl px-3 py-1.5 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                    placeholder="Prize amount in ₹"
                  />
                  {prizeDist.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePrizeTier(idx)}
                      className="p-1.5 text-void-400 hover:text-status-error rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Match Rules */}
        <div className="p-5 rounded-2xl bg-void-900 border border-void-700/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-display font-black text-purple-bright uppercase tracking-wider">
              4. Dynamic Tournament Rules
            </h3>
            <button
              type="button"
              onClick={handleAddRule}
              className="text-[11px] font-display font-bold text-purple-bright hover:underline uppercase flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="space-y-2">
            {rules.map((ruleText, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-void-400 w-6">{idx + 1}.</span>
                <input
                  type="text"
                  value={ruleText}
                  onChange={(e) => handleRuleChange(idx, e.target.value)}
                  placeholder="Enter tournament rule..."
                  className="flex-1 bg-void-800 border border-void-700 rounded-xl px-3 py-1.5 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="p-1.5 text-void-400 hover:text-status-error rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button asAnchor href="/admin/matches" variant="outline" size="md">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? 'Initializing Slots...' : 'Create & Provision Slots'}
          </Button>
        </div>
      </form>
    </div>
  );
}
