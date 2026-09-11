'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Menu, X, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);

      const sections = siteConfig.navItems.map((item) => item.href.replace('#', ''));
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'bg-void-900/95 backdrop-blur-md border-b border-void-600/80 py-2 sm:py-3 shadow-xl'
            : 'bg-gradient-to-b from-void-999/95 via-void-999/70 to-transparent py-2.5 sm:py-4'
        }`}
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 8px))' }}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <a href="#hero" className="flex items-center gap-2 sm:gap-2.5 group">
            {/* Official Void X Arena Logo Emblem */}
            <img
              src="/assets/images/logo/logo-mark.png"
              alt="Void X Arena Emblem"
              className="h-8 sm:h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-display font-black text-base sm:text-lg tracking-wider text-void-100 group-hover:text-white transition-colors">
                  VOID <span className="text-purple-brand">X</span>
                </span>
                <span className="text-[9px] font-display font-black tracking-wider px-1 py-0.2 rounded bg-purple-brand/15 text-purple-bright border border-purple-brand/40 uppercase">
                  ARENA
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] font-sans text-void-300 tracking-widest uppercase hidden sm:block -mt-0.5">
                Free Fire Esports
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-void-800/80 px-3.5 py-1.5 rounded-full border border-void-600/70 backdrop-blur-sm">
            {siteConfig.navItems.slice(0, 6).map((item) => {
              const isActive = activeSection === item.href.replace('#', '');
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`relative px-3 py-1 text-xs font-display font-bold uppercase tracking-wider transition-colors rounded-full ${
                    isActive
                      ? 'text-purple-bright'
                      : 'text-void-300 hover:text-purple-highlight hover:bg-void-700/50'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 rounded-full bg-purple-brand/15 border border-purple-brand/40 -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action & Live Ticker */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Live Matches Indicator */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-md bg-void-800 border border-void-600/60 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
              </span>
              <span className="text-void-300 font-sans text-xs">
                <strong className="text-void-100 font-display">5,863</strong> in Queue
              </span>
            </div>

            {/* Enter Arena App CTA */}
            <Button
              asAnchor
              href="/arena"
              variant="outline"
              size="sm"
              className="text-xs !px-3 shadow-purple-sm border-purple-brand/60 text-purple-bright hover:bg-purple-brand/20"
            >
              Enter Arena
            </Button>

            {/* Download App CTA */}
            <Button
              asAnchor
              href="#app-download"
              variant="primary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              iconPosition="left"
            >
              Get App
            </Button>
          </div>

          {/* Mobile Menu Trigger & Mini App Button */}
          <div className="flex sm:hidden items-center gap-1.5">
            <Button
              asAnchor
              href="/arena"
              variant="primary"
              size="sm"
              className="!min-h-[30px] !px-2.5 !py-0.5 !text-[11px] shadow-purple-sm"
            >
              Enter Arena
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-void-200 hover:text-void-100 hover:bg-void-800 rounded-md transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-down Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[52px] sm:top-[60px] z-30 bg-void-900/98 border-b border-void-600 backdrop-blur-xl p-4 lg:hidden shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex flex-col gap-1.5">
              {siteConfig.navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 px-2.5 text-xs font-display font-bold uppercase tracking-wider text-void-200 hover:text-purple-bright hover:bg-void-800 rounded-md transition-colors"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-void-400" />
                </a>
              ))}

              <div className="pt-3 mt-1 border-t border-void-700/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] text-void-300 px-2">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success inline-block" />
                    Servers Live
                  </span>
                  <span className="text-void-100 font-display font-bold">5,863 Contenders</span>
                </div>

                <Button
                  asAnchor
                  href="#app-download"
                  variant="primary"
                  size="md"
                  onClick={() => setMobileMenuOpen(false)}
                  icon={<Download className="w-4 h-4" />}
                  className="w-full !min-h-[40px] !text-xs"
                >
                  Download Android APK
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
