'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void-950 flex flex-col items-center justify-center text-void-300">
        <div className="w-10 h-10 border-2 border-purple-brand border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-wider text-void-400">
          Authenticating Marshal Session...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-void-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-void-900 border border-void-700 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-void-800 border border-purple-brand/50 flex items-center justify-center mx-auto mb-4 text-purple-bright shadow-purple-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-display font-black text-void-100 uppercase tracking-tight">
            Administrator Authentication Required
          </h2>
          <p className="text-xs text-void-300 mt-2 mb-6 leading-relaxed">
            The Void X Arena Control Plane requires verified Marshal credentials. Please sign in with an administrative account.
          </p>
          <div className="flex flex-col gap-2.5">
            <Button asAnchor href="/arena/auth/login" variant="primary" size="md" className="w-full">
              Sign In to Control Plane
            </Button>
            <Button asAnchor href="/" variant="outline" size="md" className="w-full">
              Return to Public Site
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Signed in, but role is not ADMIN
  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-void-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-void-900 border border-status-error/40 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-status-error/10 border border-status-error/30 flex items-center justify-center mx-auto mb-4 text-status-error">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-display font-black text-void-100 uppercase tracking-tight">
            Access Denied: 403 Forbidden
          </h2>
          <p className="text-xs text-void-300 mt-2 mb-6 leading-relaxed">
            Your authenticated account (<strong className="text-void-100">{user.username}</strong>) has role <code className="text-purple-bright bg-void-800 px-1 py-0.5 rounded">{user.role}</code>. Administrative privileges are strictly required.
          </p>
          <Button asAnchor href="/arena" variant="outline" size="md" className="w-full">
            Return to Contender Arena
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-950 text-void-100 flex flex-col">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
