'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WifiOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { StartupSplash } from '@/components/ui/StartupSplash';

export function MobileAppShell({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOffline, setIsOffline] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    actionUrl?: string;
  } | null>(null);

  // 1. Offline Connectivity Detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // 2. CSS Safe Area Inset Support
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top, 0px)');
      document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom, 0px)');
      document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left, 0px)');
      document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right, 0px)');
    }
  }, []);

  // 3. Authoritative Deep Link & Payment Callback Handler
  // NEVER trusts client/deep link to directly mark payment success: always calls backend /verify
  const handleVerifyOrderId = useCallback(
    async (orderId: string) => {
      if (!orderId || verifyingPayment) return;
      setVerifyingPayment(true);
      setVerificationResult(null);

      try {
        const res = await fetch('/api/v1/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setVerificationResult({
            success: true,
            message: 'Payment verified successfully! Your tournament slot is confirmed.',
            actionUrl: data.matchId ? `/arena/matches/${data.matchId}` : '/arena/wallet',
          });
        } else {
          setVerificationResult({
            success: false,
            message: data.error || 'Payment verification failed or was cancelled.',
            actionUrl: '/arena/matches',
          });
        }
      } catch (err: any) {
        setVerificationResult({
          success: false,
          message: err.message || 'Unable to connect to verification server.',
          actionUrl: '/arena/matches',
        });
      } finally {
        setVerifyingPayment(false);
      }
    },
    [verifyingPayment]
  );

  // Check URL query parameters on mount or change (e.g. redirected from payment gateway)
  useEffect(() => {
    const orderId = searchParams?.get('order_id') || searchParams?.get('orderId');
    if (orderId && !verificationResult && !verifyingPayment) {
      handleVerifyOrderId(orderId);
    }
  }, [searchParams, handleVerifyOrderId, verificationResult, verifyingPayment]);

  // 4. Capacitor App Deep Link Listener (if running inside native Android wrapper)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Capacitor native bridge is present
    const capacitorApp = (window as any)?.Capacitor?.Plugins?.App;
    if (capacitorApp && typeof capacitorApp.addListener === 'function') {
      const urlListener = capacitorApp.addListener('appUrlOpen', (data: { url: string }) => {
        try {
          const url = new URL(data.url);
          // Handle voidxarena://payment-callback?order_id=...
          if (url.protocol === 'voidxarena:' || url.pathname.includes('payment-callback')) {
            const orderId = url.searchParams.get('order_id') || url.searchParams.get('orderId');
            if (orderId) {
              handleVerifyOrderId(orderId);
            }
          }
        } catch {
          // Fallback parsing for non-standard URI schemes
          const match = data.url.match(/order_id=([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            handleVerifyOrderId(match[1]);
          }
        }
      });

      // Hardware Back Button Navigation Handler
      const backListener = capacitorApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          // Root level: ignore or minimize app
        }
      });

      return () => {
        urlListener.remove();
        backListener.remove();
      };
    }
  }, [handleVerifyOrderId]);

  return (
    <>
      <StartupSplash />
      {/* Offline Reconnection Banner */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-medium shadow-lg animate-pulse"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-spin text-white" />
            <span>You are currently offline. Reconnecting to Void X Arena servers...</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded text-xs transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Payment Verification Modal */}
      {(verifyingPayment || verificationResult) && (
        <div className="fixed inset-0 z-[10000] bg-void-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-void-900 border border-void-700 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            {verifyingPayment ? (
              <>
                <div className="w-14 h-14 rounded-full bg-purple-brand/20 border border-purple-brand flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-purple-accent animate-spin" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">Authorizing Payment</h3>
                <p className="text-sm text-void-300">
                  Verifying transaction state directly with the banking gateway. Please do not close or refresh this window...
                </p>
              </>
            ) : verificationResult?.success ? (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">Payment Confirmed!</h3>
                <p className="text-sm text-void-300">{verificationResult.message}</p>
                <button
                  onClick={() => {
                    const dest = verificationResult.actionUrl || '/arena/matches';
                    setVerificationResult(null);
                    router.push(dest);
                  }}
                  className="w-full py-3 bg-purple-brand hover:bg-purple-accent text-white font-semibold rounded-xl transition shadow-lg shadow-purple-brand/30"
                >
                  Continue to Tournament
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">Verification Failed</h3>
                <p className="text-sm text-void-300">{verificationResult?.message}</p>
                <button
                  onClick={() => {
                    setVerificationResult(null);
                    router.push(verificationResult?.actionUrl || '/arena/matches');
                  }}
                  className="w-full py-3 bg-void-800 hover:bg-void-700 text-white font-semibold rounded-xl border border-void-700 transition"
                >
                  Return to Matches
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </>
  );
}
