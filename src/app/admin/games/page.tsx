'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Gamepad2,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface GameItem {
  id: string;
  slug: string;
  name: string;
  image: string;
  gameMode: string;
  playerCount: number;
  badge?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  displayOrder: number;
  activeMatchesCount: number;
}

export default function AdminGamesPage() {
  const { accessToken } = useAuth();
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [image, setImage] = useState('');
  const [gameMode, setGameMode] = useState('');
  const [playerCount, setPlayerCount] = useState(48);
  const [badge, setBadge] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const fetchGames = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/games', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGames(json.data);
      } else {
        setError(json.error?.message || 'Failed to load games.');
      }
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [accessToken]);

  const openCreateModal = () => {
    setEditingGame(null);
    setName('');
    setSlug('');
    setImage('/assets/images/freefire/battle-royale.jpg');
    setGameMode('BATTLE_ROYALE_SQUAD');
    setPlayerCount(48);
    setBadge('FEATURED');
    setDisplayOrder(games.length + 1);
    setStatus('ACTIVE');
    setModalOpen(true);
  };

  const openEditModal = (game: GameItem) => {
    setEditingGame(game);
    setName(game.name);
    setSlug(game.slug);
    setImage(game.image);
    setGameMode(game.gameMode);
    setPlayerCount(game.playerCount);
    setBadge(game.badge || '');
    setDisplayOrder(game.displayOrder);
    setStatus(game.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSubmitting(true);

    const payload = {
      name,
      slug,
      image,
      gameMode,
      playerCount: Number(playerCount),
      badge: badge.trim() ? badge.trim() : null,
      displayOrder: Number(displayOrder),
      status,
    };

    try {
      const url = editingGame
        ? `/api/v1/admin/games/${editingGame.id}`
        : '/api/v1/admin/games';
      const method = editingGame ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        await fetchGames();
      } else {
        alert(json.error?.message || 'Failed to save game');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving game');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!accessToken || !confirm(`Delete game card "${name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/games/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (json.success) {
        await fetchGames();
      } else {
        alert(json.error?.message || 'Failed to delete game.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (game: GameItem) => {
    if (!accessToken) return;
    const newStatus = game.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      const res = await fetch(`/api/v1/admin/games/${game.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchGames();
      } else {
        alert(json.error?.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-void-100 uppercase tracking-tight">
            Esports Games & Modes Management
          </h1>
          <p className="text-xs text-void-400 mt-1">
            Configure dynamic tournament game cards, cover banners, and display hierarchies without updating client builds.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="sm"
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Add Game Card
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error">
          {error}
        </div>
      )}

      {/* Games Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-void-400 font-mono">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-bright" />
            Loading Esports Games...
          </div>
        ) : games.length === 0 ? (
          <div className="col-span-full py-16 text-center text-void-400 font-mono">
            No games configured. Click "Add Game Card" to create one.
          </div>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className={`rounded-2xl bg-void-900 border transition-all overflow-hidden flex flex-col ${
                game.status === 'ACTIVE'
                  ? 'border-void-700/80 hover:border-purple-brand/60 shadow-lg'
                  : 'border-void-800 opacity-60'
              }`}
            >
              {/* Card Banner Image */}
              <div className="relative h-36 bg-void-800 overflow-hidden">
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void-900 via-void-900/30 to-transparent" />

                {/* Badge */}
                {game.badge && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-purple-brand text-white font-display font-black text-[9px] uppercase tracking-wider shadow-purple-sm">
                    {game.badge}
                  </span>
                )}

                {/* Status Toggle Button */}
                <button
                  onClick={() => handleToggleStatus(game)}
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-display font-bold uppercase ${
                    game.status === 'ACTIVE'
                      ? 'bg-status-success/20 text-status-success border border-status-success/40'
                      : 'bg-void-800 text-void-400 border border-void-700'
                  }`}
                >
                  {game.status}
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-display font-black text-void-100 uppercase">
                    {game.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-void-400 mt-1">
                    <span className="text-purple-bright">{game.gameMode}</span>
                    <span>•</span>
                    <span>{game.playerCount} Players</span>
                    <span>•</span>
                    <span>Order: #{game.displayOrder}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-void-800 text-xs">
                  <span className="text-void-400 font-mono text-[11px]">
                    {game.activeMatchesCount} active fixtures
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(game)}
                      className="p-1.5 bg-void-800 hover:bg-void-750 text-void-200 rounded-lg transition-colors"
                      title="Edit Game"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(game.id, game.name)}
                      className="p-1.5 bg-void-800 hover:bg-status-error/20 text-void-400 hover:text-status-error rounded-lg transition-colors"
                      title="Delete Game"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-void-900 border border-void-700 shadow-2xl">
            <h3 className="text-base font-display font-black text-void-100 uppercase mb-4">
              {editingGame ? `Edit Game: ${editingGame.name}` : 'Add Esports Game Card'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                    Game Title
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Free Fire Battle Royale"
                    className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                    Unique Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. free-fire-battle-royale"
                    className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                  Banner Image URL (Asset Path or Web URL)
                </label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/assets/images/freefire/battle-royale.jpg"
                  className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                    Mode Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value)}
                    placeholder="e.g. BATTLE_ROYALE_SQUAD"
                    className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                    Player Count
                  </label>
                  <input
                    type="number"
                    required
                    min={2}
                    value={playerCount}
                    onChange={(e) => setPlayerCount(parseInt(e.target.value, 10))}
                    className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    required
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10))}
                    className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 font-mono focus:outline-none focus:border-purple-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                    Promo Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. FEATURED, POPULAR"
                    className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 uppercase focus:outline-none focus:border-purple-brand"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-display font-bold uppercase text-void-300 mb-1">
                    Visibility Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-void-800 border border-void-700 rounded-xl px-3 py-2 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
                  >
                    <option value="ACTIVE">ACTIVE (Visible in App)</option>
                    <option value="INACTIVE">INACTIVE (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-void-800 hover:bg-void-750 text-void-300 rounded-xl text-xs font-display font-bold uppercase"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Saving...' : editingGame ? 'Save Changes' : 'Create Game'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
