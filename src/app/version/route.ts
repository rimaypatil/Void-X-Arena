import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const publicInfo: Record<string, any> = {
    version: '1.0.0',
    build: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'vxa-prod-c1a79',
    buildTime: '2026-09-10T12:00:00.000Z',
    environment: process.env.NODE_ENV || 'production',
  };

  try {
    const { user } = await AuthMiddleware.requireAdmin(request);
    if (user && user.role === 'ADMIN') {
      publicInfo.operatorDiagnostics = {
        databaseEngine: 'PostgreSQL 16',
        framework: 'Next.js 14.2.23 (App Router)',
        gateway: process.env.PAYMENT_GATEWAY_MODE || 'CASHFREE',
        uptimeSeconds: Math.floor(process.uptime()),
      };
    }
  } catch {
    // Non-admin: return standard public payload
  }

  return NextResponse.json(publicInfo, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
