'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Trophy, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/Button';
import { PlayerPayout } from '@/types/tournament';
import rawPlayersData from '@/data/players.json';

const allPlayers = rawPlayersData as PlayerPayout[];
const MAX_HISTORY = 500;
const VISIBLE_CARDS_COUNT = 4;

export const Community: React.FC = () => {
  // Always maintain exactly 4 visible cards, initialized with the first 4 champions
  const [cards, setCards] = useState<PlayerPayout[]>(() => allPlayers.slice(0, VISIBLE_CARDS_COUNT));

  // Rolling FIFO history of the last 500 displayed IDs (including initial 4)
  const historyRef = useRef<{ queue: number[]; set: Set<number> }>({
    queue: allPlayers.slice(0, VISIBLE_CARDS_COUNT).map(p => p.id),
    set: new Set(allPlayers.slice(0, VISIBLE_CARDS_COUNT).map(p => p.id)),
  });

  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const scheduleNext = () => {
      // Natural 3.5s - 5s live payout interval
      const delay = Math.floor(Math.random() * 1500) + 3500;

      timerId = setTimeout(() => {
        if (!isMounted) return;

        const { queue, set } = historyRef.current;

        // Select a candidate that has not appeared in the last 500 entries
        let candidate: PlayerPayout | null = null;
        for (let attempt = 0; attempt < 200; attempt++) {
          const randIdx = Math.floor(Math.random() * allPlayers.length);
          const p = allPlayers[randIdx];
          if (!set.has(p.id)) {
            candidate = p;
            break;
          }
        }

        if (!candidate) {
          candidate = allPlayers.find(p => !set.has(p.id)) || allPlayers[0];
        }

        // Maintain 500-entry rolling window
        queue.push(candidate.id);
        set.add(candidate.id);

        if (queue.length > MAX_HISTORY) {
          const oldestId = queue.shift();
          if (oldestId !== undefined) {
            set.delete(oldestId);
          }
        }

        // Advance feed: FIFO queue of 4 cards
        setCards(prev => [...prev.slice(1), candidate!]);

        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []);

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-void-950 border-t border-void-800 relative">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center">
          
          {/* LEFT: Discord & WhatsApp Squad Community */}
          <div className="lg:col-span-6 bg-gradient-to-br from-void-850 to-void-800 border border-void-600 rounded-xl p-3.5 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-purple-brand/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-purple-brand/40 mb-2 sm:mb-3.5">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-bright" />
              <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
                Community Hub
              </span>
            </div>

            <h3 className="font-display font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-tight text-void-100">
              Join 15,000+ Contenders On Discord & WhatsApp
            </h3>

            <p className="mt-1.5 sm:mt-2.5 text-xs sm:text-sm text-void-300 leading-relaxed">
              Find squad teammates, get instant tournament alerts, participate in community giveaways, and contact referees.
            </p>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                asAnchor
                href={siteConfig.socialLinks.discord}
                variant="primary"
                size="md"
                icon={<ExternalLink className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Join Discord
              </Button>

              <Button
                asAnchor
                href={siteConfig.socialLinks.whatsapp}
                variant="secondary"
                size="md"
                icon={<ExternalLink className="w-4 h-4 text-status-success" />}
                className="w-full sm:w-auto"
              >
                WhatsApp Alerts
              </Button>
            </div>
          </div>

          {/* RIGHT: Live Hall of Champions */}
          <div className="lg:col-span-6 bg-void-900 border border-void-600 rounded-xl p-4 sm:p-7">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-void-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-bright" />
                <h4 className="font-display font-black text-sm sm:text-base uppercase text-void-100">
                  Recent Arena Champions
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-wider text-status-success px-1.5 py-0.5 rounded bg-status-success/10 border border-status-success/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-success" />
                </span>
                Verified Payouts
              </span>
            </div>

            <div className="space-y-2 sm:space-y-2.5 overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                {cards.map((champ) => (
                  <motion.div
                    key={champ.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{
                      layout: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.3 },
                      y: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-void-800 border border-void-700/60 text-xs hover:border-purple-brand/30 transition-colors"
                  >
                    <div className="truncate mr-2">
                      <p className="font-display font-black text-void-100 text-xs sm:text-sm truncate">
                        {champ.name}
                      </p>
                      <span className="text-void-300 text-[10px] sm:text-[11px] truncate block">
                        {champ.event} • <strong className="text-void-100">{champ.kills} Kills</strong>
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display font-black text-purple-highlight text-xs sm:text-sm">
                        ₹{champ.withdrawal.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[8px] sm:text-[9px] text-status-success font-medium">Credited</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
