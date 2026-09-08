'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Wallet, Trophy, User as UserIcon, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ArenaShellProps {
  children: React.ReactNode;
}

export const ArenaShell: React.FC<ArenaShellProps> = ({ children }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: 'Matches', href: '/arena', icon: Swords },
    { label: 'Wallet', href: '/arena/wallet', icon: Wallet },
    { label: 'Results', href: '/arena/results', icon: Trophy },
    { label: 'Profile', href: '/arena/profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-void-999 text-void-100 flex flex-col justify-between items-center selection:bg-purple-brand selection:text-white antialiased">
      {/* Centered responsive mobile viewport container (320px to 480px) */}
      <div className="w-full max-w-md min-h-screen bg-void-950 flex flex-col relative shadow-2xl border-x border-void-800/80">
        
        {/* Top App Header (Fixed safe-area top) */}
        <header className="sticky top-0 z-40 bg-void-900/95 backdrop-blur-md border-b border-void-700/80 px-4 pt-safe pb-2.5 flex items-center justify-between">
          <Link href="/arena" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-brand to-purple-hover flex items-center justify-center text-[10px] font-black font-display text-white shadow-purple-sm">
              VX
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xs tracking-wider text-void-100 leading-none">
                VOID <span className="text-purple-brand">X</span> ARENA
              </span>
              <span className="text-[8px] font-display text-status-success font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse inline-block" />
                LOBBIES LIVE
              </span>
            </div>
          </Link>

          {/* Right Action: Wallet Balance pill or Login CTA */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/arena/wallet"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-void-800 border border-purple-brand/40 text-purple-highlight hover:border-purple-brand transition-colors text-xs font-display font-bold shadow-purple-sm"
              >
                <Wallet className="w-3.5 h-3.5 text-purple-bright" />
                <span>₹{user.wallet?.balance?.toFixed(2) || '0.00'}</span>
              </Link>
            ) : (
              <Link
                href="/arena/auth/login"
                className="px-2.5 py-1 rounded-md bg-purple-brand hover:bg-purple-hover text-white text-[11px] font-display font-bold uppercase tracking-wider transition-all shadow-purple-sm"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/arena/notifications"
              className="relative p-1.5 rounded-full bg-void-800 text-void-300 hover:text-void-100 hover:bg-void-700 border border-void-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {user && (user.stats?.unreadNotificationsCount || 0) > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-status-danger ring-2 ring-void-900" />
              )}
            </Link>
          </div>
        </header>

        {/* Dynamic Screen Content */}
        <main className="flex-1 flex flex-col px-3.5 sm:px-4 py-3 pb-24 overflow-y-auto">
          {children}
        </main>

        {/* Authoritative 4-Item Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-void-900/95 backdrop-blur-lg border-t border-void-700/80 pb-safe pt-1.5 px-3 flex items-center justify-around pointer-events-auto shadow-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/arena' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-purple-bright font-extrabold'
                      : 'text-void-400 hover:text-void-200'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'scale-110 text-purple-bright' : 'opacity-70'
                    }`}
                  />
                  <span className="text-[10px] font-display uppercase tracking-wider mt-1">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-purple-bright mt-0.5 shadow-purple-sm" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
};
