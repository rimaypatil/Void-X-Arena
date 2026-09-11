'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Swords,
  Gamepad2,
  Trophy,
  CreditCard,
  Users,
  ShieldAlert,
  Settings,
  ArrowUpRight,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Matches', href: '/admin/matches', icon: Swords },
  { label: 'Games', href: '/admin/games', icon: Gamepad2 },
  { label: 'Results & Scoring', href: '/admin/results', icon: Trophy },
  { label: 'Payments & Refunds', href: '/admin/payments', icon: CreditCard },
  { label: 'Contenders & Wallets', href: '/admin/users', icon: Users },
  { label: 'Audit Logs', href: '/admin/audit', icon: ShieldAlert },
  { label: 'Settings & Banners', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-void-900 border-r border-void-700 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-void-700/80">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-brand to-purple-deep flex items-center justify-center font-display font-black text-sm text-white shadow-purple-sm">
              VX
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-display font-black text-sm text-void-100 tracking-wider">
                  VOID <span className="text-purple-brand">X</span>
                </span>
                <span className="text-[9px] font-display font-black px-1 py-0.5 rounded bg-purple-brand/20 text-purple-bright border border-purple-brand/40 uppercase">
                  OPS
                </span>
              </div>
              <span className="text-[9px] font-mono text-void-400 block -mt-0.5 uppercase tracking-wider">
                Control Plane v1.0
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1 text-void-400 hover:text-void-100 lg:hidden rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-purple-brand text-white shadow-purple-sm'
                    : 'text-void-300 hover:text-void-100 hover:bg-void-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-void-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-void-700/80 space-y-2">
          {/* Link back to public player Arena */}
          <Link
            href="/arena"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-void-700 text-xs font-display font-bold text-void-200 transition-colors"
          >
            <span>View Player Arena</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-void-400" />
          </Link>

          {/* User badge & Logout */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-void-800 border border-void-700">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-display font-black text-void-100 uppercase truncate block">
                {user?.username || 'Administrator'}
              </span>
              <span className="text-[9px] font-mono text-purple-bright uppercase">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-void-400 hover:text-status-error hover:bg-void-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
