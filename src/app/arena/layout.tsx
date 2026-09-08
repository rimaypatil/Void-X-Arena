import React from 'react';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { ArenaShell } from '@/components/arena/ArenaShell';
import { SystemOverlay } from '@/components/arena/SystemOverlay';

export const viewport: Viewport = {
  themeColor: '#08080D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'VOID X ARENA | Official Mobile Tournament Client',
  description: 'Enter the Free Fire arena, register for daily custom rooms, and compete for verified prizes.',
};

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SystemOverlay>
        <ArenaShell>{children}</ArenaShell>
      </SystemOverlay>
    </AuthProvider>
  );
}
