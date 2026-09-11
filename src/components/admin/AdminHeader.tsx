'use client';

import React from 'react';
import { Menu, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminHeader: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 px-4 lg:px-8 bg-void-900 border-b border-void-700/80 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 text-void-300 hover:text-white hover:bg-void-800 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-success/10 border border-status-success/30 text-status-success text-[11px] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
            <span>OPERATIONAL</span>
          </div>
          <span className="text-void-400 text-xs hidden sm:inline">|</span>
          <span className="text-void-300 text-xs font-sans hidden sm:inline">
            PostgreSQL Ledger Synchronized
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-void-800 border border-void-700">
          <ShieldCheck className="w-4 h-4 text-purple-bright" />
          <span className="text-xs font-display font-bold text-void-200">
            {user?.username}
          </span>
        </div>
      </div>
    </header>
  );
};
