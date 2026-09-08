'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Gamepad2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface SlotItem {
  id: string;
  slotNumber: number;
  teamNumber: number;
  position: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
  isMine?: boolean;
}

export default function SlotSelectionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inGameName, setInGameName] = useState('');
  const [inGameId, setInGameId] = useState('');

  useEffect(() => {
    if (user) {
      setInGameName(user.gameName || user.username || '');
      setInGameId(user.gameUid || '');
    }
  }, [user]);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`/api/v1/matches/${params.id}/slots`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setSlots(json.data.slots);
      } else {
        setError(json.error?.message || 'Failed to load slot grid.');
      }
    } catch {
      setError('Network error fetching slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [params.id, accessToken]);

  const handleReserve = async () => {
    if (!user || !accessToken) {
      router.push(`/arena/auth/login?redirect=/arena/matches/${params.id}/slots`);
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available slot.');
      return;
    }

    if (!inGameName.trim() || !inGameId.trim()) {
      setError('Free Fire IGN and Game UID are required for tournament registration.');
      return;
    }

    setReserving(true);
    setError(null);

    try {
      // 1. Atomic slot reservation
      const res = await fetch(`/api/v1/matches/${params.id}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          slotNumber: selectedSlot.slotNumber,
          inGameName: inGameName.trim(),
          inGameId: inGameId.trim(),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message || 'Slot reservation failed.');
        setReserving(false);
        fetchSlots(); // Refresh grid to reflect new state
        return;
      }

      const joiningId = json.data.joining.id;

      // 2. Initialize Payment Order
      const orderRes = await fetch(`/api/v1/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ joiningId }),
      });

      const orderJson = await orderRes.json();
      if (orderJson.success && orderJson.data) {
        const orderId = orderJson.data.orderId;
        router.push(
          `/arena/payments/checkout?order_id=${orderId}&joining_id=${joiningId}&match_id=${params.id}`
        );
      } else {
        setError('Failed to create payment order.');
        setReserving(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during slot reservation.');
      setReserving(false);
    }
  };

  // Group slots by teamNumber
  const teamsMap = new Map<number, SlotItem[]>();
  slots.forEach((s) => {
    if (!teamsMap.has(s.teamNumber)) teamsMap.set(s.teamNumber, []);
    teamsMap.get(s.teamNumber)!.push(s);
  });
  const teams = Array.from(teamsMap.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-void-850 border border-void-700 text-void-300 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[9px] font-display font-extrabold uppercase text-purple-bright tracking-wider">
            Match Slot Allocation
          </span>
          <h2 className="font-display font-black text-sm text-void-100 uppercase">
            Select Your Team Slot
          </h2>
        </div>
      </div>

      {/* Status Legend */}
      <div className="p-2.5 rounded-xl bg-void-900 border border-void-800 flex items-center justify-around text-[10px] font-display font-bold">
        <div className="flex items-center gap-1 text-void-300">
          <span className="w-3 h-3 rounded bg-void-800 border border-void-600" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1 text-status-warning">
          <span className="w-3 h-3 rounded bg-status-warning/20 border border-status-warning" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1 text-void-400">
          <span className="w-3 h-3 rounded bg-void-700 border border-void-600 opacity-50" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1 text-purple-bright">
          <span className="w-3 h-3 rounded bg-purple-brand border border-purple-bright" />
          <span>Selected</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/40 flex items-center gap-2 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Slots Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-void-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-bright" />
          <span>Loading live tournament slot grid...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(([teamNum, teamSlots]) => (
            <div
              key={teamNum}
              className="p-3 rounded-xl bg-void-850 border border-void-750 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-display font-extrabold uppercase text-void-200">
                  Team #{teamNum}
                </span>
                <span className="text-[9px] text-void-400 font-mono">
                  {teamSlots.filter((s) => s.status === 'AVAILABLE').length}/{teamSlots.length} Free
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {teamSlots.map((slot) => {
                  const isAvailable = slot.status === 'AVAILABLE';
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-lg text-center transition-all border flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-purple-brand text-white border-purple-bright shadow-purple-sm scale-105'
                          : isAvailable
                          ? 'bg-void-800 hover:bg-void-750 text-void-200 border-void-700 hover:border-purple-brand/60'
                          : slot.status === 'RESERVED'
                          ? 'bg-status-warning/10 text-status-warning border-status-warning/30 cursor-not-allowed'
                          : 'bg-void-900 text-void-500 border-void-800 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="text-[9px] font-display font-black">
                        P{slot.position}
                      </span>
                      <span className="text-[10px] font-mono font-bold mt-0.5">
                        #{slot.slotNumber}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contender IGN & Game UID Verification Input Card */}
      {selectedSlot && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-void-850 to-void-900 border border-purple-brand/60 shadow-purple-sm space-y-3">
          <div className="flex items-center justify-between border-b border-void-800 pb-2">
            <span className="text-xs font-display font-black uppercase text-void-100">
              Selected: Slot #{selectedSlot.slotNumber} (Team #{selectedSlot.teamNumber})
            </span>
            <span className="text-[10px] text-status-success font-bold font-display">READY</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-[10px] font-display font-bold uppercase text-void-300 mb-1">
                Free Fire In-Game Name (IGN) *
              </label>
              <input
                type="text"
                value={inGameName}
                onChange={(e) => setInGameName(e.target.value)}
                placeholder="e.g. VIPER_44"
                className="w-full bg-void-900 border border-void-700 rounded-xl py-2 px-3 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
              />
            </div>

            <div>
              <label className="block text-[10px] font-display font-bold uppercase text-void-300 mb-1">
                Free Fire Game UID *
              </label>
              <input
                type="text"
                value={inGameId}
                onChange={(e) => setInGameId(e.target.value)}
                placeholder="e.g. 749201844"
                className="w-full bg-void-900 border border-void-700 rounded-xl py-2 px-3 text-xs text-void-100 focus:outline-none focus:border-purple-brand"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={reserving}
            onClick={handleReserve}
            className="w-full shadow-purple-sm text-xs font-black uppercase"
          >
            Lock Slot & Proceed to Payment
          </Button>
        </div>
      )}
    </div>
  );
}
