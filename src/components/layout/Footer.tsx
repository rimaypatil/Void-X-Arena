import React from 'react';
import { siteConfig } from '@/config/site';
import { ShieldCheck, Flame, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-void-999 border-t border-void-600 pt-8 sm:pt-14 pb-6 sm:pb-10 text-void-300">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-8 pb-6 sm:pb-10 border-b border-void-800">
          
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/assets/images/logo/logo-mark.png"
                alt="Void X Arena Logo"
                className="h-7 w-auto object-contain shrink-0"
              />
              <span className="font-display font-black text-base sm:text-lg tracking-wider text-void-100">
                VOID <span className="text-purple-brand">X</span> ARENA
              </span>
            </div>
            
            <p className="text-xs text-void-300 max-w-sm leading-relaxed">
              The premier competitive esports arena for Free Fire champions. Verified custom rooms, instant automated room pass distribution, and transparent skill rewards.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-void-200 bg-void-800 px-2 py-0.5 rounded border border-void-600">
                <ShieldCheck className="w-3 h-3 text-status-success" />
                Anti-Cheat Protected
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-void-200 bg-void-800 px-2 py-0.5 rounded border border-void-600">
                <Flame className="w-3 h-3 text-purple-bright" />
                Instant Room Pass
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-display font-bold uppercase tracking-wider text-void-100 mb-1">
              Navigation
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs">
              <li>
                <a href="#hero" className="hover:text-purple-highlight transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#free-fire" className="hover:text-purple-highlight transition-colors">
                  Free Fire
                </a>
              </li>
              <li>
                <a href="#game-modes" className="hover:text-purple-highlight transition-colors">
                  Game Modes
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-purple-highlight transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-purple-highlight transition-colors">
                  Why Void X
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-display font-bold uppercase tracking-wider text-void-100 mb-1">
              Community
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs">
              <li>
                <a
                  href={siteConfig.socialLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-highlight transition-colors inline-flex items-center gap-1"
                >
                  Discord <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-highlight transition-colors inline-flex items-center gap-1"
                >
                  WhatsApp <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-highlight transition-colors inline-flex items-center gap-1"
                >
                  YouTube <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-purple-highlight transition-colors">
                  Referee Desk
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Rules */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-display font-bold uppercase tracking-wider text-void-100 mb-1">
              Rules & Trust
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs">
              <li>
                <a href="#faq" className="hover:text-purple-highlight transition-colors">
                  Match Rules
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-purple-highlight transition-colors">
                  Fair Play Policy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-purple-highlight transition-colors">
                  Dispute Protocol
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-purple-highlight transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Disclaimer */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-void-300">
          <p>
            © {new Date().getFullYear()} VOID X ARENA. All rights reserved.
          </p>
          <p className="text-center md:text-right max-w-xl text-[10px] text-void-400 leading-relaxed">
            Disclaimer: Void X Arena is an independent esports community tournament platform and is not affiliated with, endorsed by, or sponsored by Garena or Free Fire.
          </p>
        </div>
      </div>
    </footer>
  );
};
