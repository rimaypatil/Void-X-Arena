import { NextRequest, NextResponse } from 'next/server';
import { DistributedRateLimiter } from '@/lib/security/rateLimiter';

// Configurable Allowed Origins
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'capacitor://localhost',
  'http://localhost',
  'https://voidxarena.gg',
  'https://www.voidxarena.gg',
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : []),
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. CORS Preflight Handling for API Routes
  if (request.method === 'OPTIONS' && pathname.startsWith('/api')) {
    const isAllowed = !origin || ALLOWED_ORIGINS.has(origin);
    const preflightHeaders = new Headers({
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-webhook-signature, x-webhook-timestamp, x-cf-signature, x-cf-timestamp',
      'Access-Control-Max-Age': '86400',
    });

    if (isAllowed && origin) {
      preflightHeaders.set('Access-Control-Allow-Origin', origin);
      preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
    }

    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // 2. Maintenance Mode Interception (Zero DB queries — reads runtime environment / cached flag)
  const isMaintenanceArmed = process.env.MAINTENANCE_MODE === 'true';
  const isExemptFromMaintenance =
    pathname.startsWith('/api/v1/admin') ||
    pathname.startsWith('/admin') ||
    pathname === '/health' ||
    pathname === '/readiness' ||
    pathname === '/version' ||
    pathname === '/api/health' ||
    pathname === '/api/readiness' ||
    pathname === '/api/version';

  if (isMaintenanceArmed && !isExemptFromMaintenance) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MAINTENANCE_MODE',
            message: 'Void X Arena is undergoing scheduled system upgrades. Battles resume shortly.',
          },
        },
        { status: 503 }
      );
    }
  }

  // 3. Route-Specific Distributed Rate Limiting
  let rateLimitResult = null;
  if (pathname.startsWith('/api/v1/auth')) {
    rateLimitResult = await DistributedRateLimiter.checkLimit(`auth:${ip}`, 15, 60);
  } else if (pathname.startsWith('/api/v1/payments/create-order')) {
    rateLimitResult = await DistributedRateLimiter.checkLimit(`order:${ip}`, 20, 60);
  } else if (pathname.startsWith('/api/v1/admin')) {
    rateLimitResult = await DistributedRateLimiter.checkLimit(`admin:${ip}`, 40, 60);
  } else if (pathname.startsWith('/api')) {
    rateLimitResult = await DistributedRateLimiter.checkLimit(`api:${ip}`, 120, 60);
  }

  if (rateLimitResult && !rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        },
      }
    );
  }

  // 4. Continue Request with Security & CORS Headers
  const response = NextResponse.next();

  // Inject CORS
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Inject RateLimit Headers if evaluated
  if (rateLimitResult) {
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime));
  }

  // Inject Production Security Headers (CSP initially in Report-Only mode to protect payment redirects)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.cashfree.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*",
    "connect-src 'self' https://api.cashfree.com https://sandbox.cashfree.com https://*",
    "frame-src 'self' https://sdk.cashfree.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy-Report-Only', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets/ (static media assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
  ],
};
