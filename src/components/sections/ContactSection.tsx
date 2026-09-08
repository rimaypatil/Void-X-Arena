'use client';

import React from 'react';
import { MessageSquare, Headphones, Clock, ExternalLink } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/Button';

const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-8 sm:py-12 lg:py-20 bg-void-850 relative">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-void-800 border border-void-600 mb-1.5 sm:mb-3">
            <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-bright" />
            <span className="text-[10px] sm:text-xs font-display font-extrabold uppercase tracking-widest text-purple-bright">
              Referee & Support Desk
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-void-100">
            Tournament Support
          </h2>
          <p className="text-xs sm:text-sm text-void-300 mt-1.5 sm:mt-2">
            Need assistance with a match result, custom room dispute, or organizing a guild scrim? Our team is active 24/7.
          </p>
        </div>

        {/* Support Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          
          {/* Discord Referee Desk */}
          <div className="flex flex-col justify-between bg-void-800 border border-void-600 rounded-xl p-4 sm:p-6 hover:border-purple-brand/50 transition-colors shadow-card-dark">
            <div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-void-850 border border-void-700 flex items-center justify-center text-purple-bright mb-3 sm:mb-4 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-display font-black text-sm sm:text-base md:text-lg text-void-100 uppercase tracking-wide">
                Live Discord Desk
              </h3>
              <p className="text-[11px] sm:text-xs text-void-300 mt-1.5 leading-relaxed">
                Open a referee dispute ticket on Discord for instant match video review and live coordinator assistance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-void-700/60">
              <Button
                asAnchor
                href={siteConfig.socialLinks.discord}
                variant="outline"
                size="sm"
                className="w-full"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open Discord Ticket
              </Button>
            </div>
          </div>

          {/* Telegram Community */}
          <div className="flex flex-col justify-between bg-void-800 border border-void-600 rounded-xl p-4 sm:p-6 hover:border-purple-brand/50 transition-colors shadow-card-dark">
            <div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-void-850 border border-void-700 flex items-center justify-center text-purple-highlight mb-3 sm:mb-4 shrink-0">
                <TelegramIcon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-black text-sm sm:text-base md:text-lg text-void-100 uppercase tracking-wide">
                Telegram Community
              </h3>
              <p className="text-[11px] sm:text-xs text-void-300 mt-1.5 leading-relaxed">
                Join our Telegram community for announcements, updates, support, and tournament discussions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-void-700/60">
              <Button
                asAnchor
                href={siteConfig.socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Join Telegram
              </Button>
            </div>
          </div>

          {/* Fast Response Guarantee */}
          <div className="flex flex-col justify-between bg-void-800 border border-void-600 rounded-xl p-4 sm:p-6 hover:border-purple-brand/50 transition-colors shadow-card-dark">
            <div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-void-850 border border-void-700 flex items-center justify-center text-status-success mb-3 sm:mb-4 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-black text-sm sm:text-base md:text-lg text-void-100 uppercase tracking-wide">
                Active Match SLA
              </h3>
              <p className="text-[11px] sm:text-xs text-void-300 mt-1.5 leading-relaxed">
                During active tournament fixtures, dispute tickets are resolved with average response time under 15 minutes.
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-status-success font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                Referees Active & On Duty
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-void-700/60">
              <Button
                asAnchor
                href={siteConfig.socialLinks.whatsapp}
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<ExternalLink className="w-3.5 h-3.5 text-status-success" />}
              >
                WhatsApp Broadcast
              </Button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
