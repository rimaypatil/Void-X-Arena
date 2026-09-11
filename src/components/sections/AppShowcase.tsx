'use client';

import React from 'react';
import { Download, Bell, Apple } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';

export const AppShowcase: React.FC = () => {
  return (
    <section id="app-download" className="py-8 sm:py-12 lg:py-20 bg-void-850 relative overflow-hidden">
      <div className="absolute top-1/2 right-5 sm:right-10 -translate-y-1/2 w-[250px] sm:w-[450px] h-[250px] sm:h-[450px] bg-purple-brand/10 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: App Features, Download APK Action, QR Code */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-purple-brand/40 shadow-purple-sm mb-2 sm:mb-3.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-brand" />
              <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
                Mobile Tournament Client
              </span>
            </div>

            <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100 leading-tight">
              The Arena,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-brand via-purple-bright to-purple-highlight">
                In Your Pocket.
              </span>
            </h2>

            <p className="mt-2 sm:mt-3.5 text-xs sm:text-sm md:text-base text-void-300 max-w-xl leading-relaxed">
              Experience fast Free Fire tournament registrations, automated room ID push notifications, and verified wallet settlements in the official Void X Arena Android app.
            </p>

            {/* App Action & Notification Stack */}
            <div className="mt-4 sm:mt-6 flex flex-col items-stretch gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Push Room Alerts Notification Card */}
              <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-lg bg-void-800 border border-void-600 w-full">
                <div className="p-1.5 rounded bg-purple-brand/15 text-purple-bright shrink-0">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs uppercase text-void-100">
                    Push Room Alerts
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-void-300 mt-0.5">
                    Room credentials sent 15m before drop.
                  </p>
                </div>
              </div>

              <Button
                asAnchor
                href={siteConfig.downloadUrls.android}
                variant="primary"
                size="md"
                icon={<Download className="w-4 h-4" />}
                iconPosition="left"
                className="w-full sm:w-auto"
              >
                Download Android (APK)
              </Button>

              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-void-800 border border-void-600 text-void-300 text-xs font-display font-semibold justify-center">
                <Apple className="w-3.5 h-3.5 opacity-60" />
                <span>iOS TestFlight (Coming Soon)</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Scaled Responsive Mobile Phone Vector Frame */}
          <div className="lg:col-span-5 flex justify-center mt-4 lg:mt-0">
            <div className="relative w-full max-w-[210px] sm:max-w-[260px] lg:max-w-[300px] aspect-[9/18.5] bg-void-999 rounded-[32px] sm:rounded-[42px] p-2 sm:p-3 shadow-2xl border-3 sm:border-4 border-void-700 shadow-purple-sm">
              {/* Phone Speaker Notch */}
              <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-3.5 sm:h-4 bg-void-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-void-999 mr-1.5" />
                <div className="w-1 h-1 rounded-full bg-purple-brand/60" />
              </div>

              {/* Internal Screen Content */}
              <div className="relative w-full h-full bg-void-900 rounded-[28px] sm:rounded-[32px] overflow-hidden border border-void-800 flex flex-col pt-6 sm:pt-8 pb-3 sm:pb-4 px-3 sm:px-4 text-void-100 select-none text-xs">
                
                {/* App Status Header */}
                <div className="flex items-center justify-between pb-2 border-b border-void-800">
                  <div className="flex items-center gap-1.5">
                    <img
                      src="/assets/images/logo/logo-mark.png"
                      alt="Void X Arena"
                      className="h-5 w-auto object-contain shrink-0"
                    />
                    <span className="font-display font-black text-[11px] tracking-wider">
                      VOID <span className="text-purple-brand">X</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-status-success font-display font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block" />
                    LIVE
                  </div>
                </div>

                {/* User In-App Card */}
                <div className="mt-2.5 p-2 rounded-lg bg-void-800 border border-void-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-void-400 font-display uppercase">Contender Balance</span>
                    <p className="text-xs sm:text-sm font-display font-black text-purple-highlight">₹1,450.00</p>
                  </div>
                  <div className="px-1.5 py-0.2 rounded bg-purple-brand/20 border border-purple-brand/40 text-[8px] font-display font-bold text-purple-bright">
                    TIER 1 PRO
                  </div>
                </div>

                {/* Active Match Ticket Banner */}
                <div className="mt-2.5 p-2.5 rounded-lg bg-gradient-to-br from-purple-brand/20 to-purple-deep/30 border border-purple-brand/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-display font-black text-purple-bright uppercase">Next Fixture</span>
                    <span className="text-[8px] font-display font-bold text-void-300">Starts in 14m</span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-display font-black text-void-100 uppercase mt-0.5 truncate">
                    Bermuda Squad Room #42
                  </p>
                  
                  {/* Automated Room ID Credentials Box */}
                  <div className="mt-1.5 p-1 rounded bg-void-999/80 border border-void-700 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-void-300">ROOM: <strong className="text-purple-highlight">984210</strong></span>
                    <span className="text-void-300">PASS: <strong className="text-purple-highlight">7788</strong></span>
                  </div>
                </div>

                {/* Live Tournaments Feed */}
                <div className="mt-2.5 flex-1 flex flex-col gap-1.5 overflow-hidden">
                  <span className="text-[8px] font-display font-bold uppercase text-void-300">
                    Live Today
                  </span>
                  
                  <div className="p-1.5 rounded bg-void-800 border border-void-700/60 flex items-center justify-between text-[9px]">
                    <div>
                      <p className="font-display font-bold text-void-100 truncate">Clash Squad 4v4</p>
                      <span className="text-[8px] text-void-400">Prize: ₹1,200</span>
                    </div>
                    <span className="text-[8px] font-display font-bold text-purple-bright px-1 py-0.2 bg-purple-brand/15 rounded shrink-0">
                      Join
                    </span>
                  </div>

                  <div className="p-1.5 rounded bg-void-800 border border-void-700/60 flex items-center justify-between text-[9px]">
                    <div>
                      <p className="font-display font-bold text-void-100 truncate">1v1 Sniper Duel</p>
                      <span className="text-[8px] text-void-400">Prize: ₹500</span>
                    </div>
                    <span className="text-[8px] font-display font-bold text-purple-bright px-1 py-0.2 bg-purple-brand/15 rounded shrink-0">
                      Join
                    </span>
                  </div>
                </div>

                {/* Bottom App Navigation Bar */}
                <div className="mt-auto pt-1.5 border-t border-void-800 flex items-center justify-around text-[8px] text-void-400 font-display">
                  <span className="text-purple-bright font-bold">Matches</span>
                  <span>Wallet</span>
                  <span>Results</span>
                  <span>Profile</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
