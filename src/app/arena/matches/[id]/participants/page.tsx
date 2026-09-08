'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface Participant {
  id: string;
  slotNumber: number;
  teamNumber: number;
  position: number;
  inGameName: string;
  inGameId: string;
  joinedAt: string;
}

export default function AllJoiningsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [confirmedCount, setConfirmedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJoinings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/matches/${params.id}/joinings`);
        const json = await res.json();
        if (json.success && json.data) {
          setParticipants(json.data.participants || []);
          setConfirmedCount(json.data.confirmedCount || 0);
        } else {
          setError(json.error?.message || 'Failed to load match participants.');
        }
      } catch {
        setError('Network error fetching participants.');
      } finally {
        setLoading(false);
      }
    };

    fetchJoinings();
  }, [params.id]);

  // Group by teamNumber
  const teamsMap = new Map<number, Participant[]>();
  participants.forEach((p) => {
    if (!teamsMap.has(p.teamNumber)) teamsMap.set(p.teamNumber, []);
    teamsMap.get(p.teamNumber)!.push(p);
  });
  const teams = Array.from(teamsMap.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-void-850 border border-void-700 text-void-300 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[9px] font-display font-extrabold uppercase text-purple-bright tracking-wider">
            Verified Contenders
          </span>
          <h2 className="font-display font-black text-sm text-void-100 uppercase">
            All Confirmed Joinings
          </h2>
        </div>
      </div>

      {/* Confirmed Contenders Count Banner */}
      <div className="p-3 rounded-xl bg-void-850 border border-purple-brand/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-bright" />
          <span className="text-xs font-display font-bold uppercase text-void-100">
            Total Confirmed Players
          </span>
        </div>
        <span className="text-xs font-display font-black text-purple-highlight">
          {confirmedCount} Contenders
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/40 flex items-center gap-2 text-xs text-status-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-void-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-bright" />
          <span>Loading verified contenders...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-8 rounded-xl bg-void-850 border border-void-750 text-center">
          <Users className="w-10 h-10 text-void-500 mx-auto mb-2 opacity-50" />
          <h4 className="font-display font-bold text-xs uppercase text-void-200">
            No confirmed joinings yet
          </h4>
          <p className="text-[11px] text-void-400 mt-1">
            Be the first squad or player to register and lock your slot!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map(([teamNum, members]) => (
            <div
              key={teamNum}
              className="p-3.5 rounded-xl bg-void-850 border border-void-750 flex flex-col gap-2 shadow-card-dark"
            >
              <div className="flex items-center justify-between border-b border-void-800 pb-2">
                <span className="text-xs font-display font-black uppercase text-purple-bright">
                  Team #{teamNum}
                </span>
                <span className="text-[9px] text-void-400 font-mono">
                  {members.length} Confirmed
                </span>
              </div>

              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 rounded-lg bg-void-900 border border-void-750 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-purple-brand/20 border border-purple-brand/40 flex items-center justify-center text-[9px] font-mono font-bold text-purple-bright">
                        P{m.position}
                      </span>
                      <div>
                        <p className="font-display font-bold text-void-100 text-xs leading-none">
                          {m.inGameName}
                        </p>
                        <span className="text-[9px] text-void-400 font-mono mt-0.5 block">
                          UID: {m.inGameId}
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono text-void-400 bg-void-800 px-1.5 py-0.5 rounded">
                      Slot #{m.slotNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
