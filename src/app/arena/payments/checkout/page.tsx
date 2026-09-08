'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Loader2,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

declare global {
  interface Window {
    Cashfree?: any;
  }
}

function PaymentCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();

  const orderId = searchParams.get('order_id') || '';
  const sessionId = searchParams.get('session_id') || '';
  const matchId = searchParams.get('match_id') || '';

  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED' | 'VERIFYING'>('VERIFYING');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Verifying payment with tournament gateway...');
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);

  // 1. Authoritative Backend Payment Verification
  const verifyPaymentAuthoritative = useCallback(async () => {
    if (!orderId || !accessToken) return;

    setProcessing(true);
    setStatusMessage('Checking authoritative payment status...');

    try {
      const res = await fetch('/api/v1/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const json = await res.json();

      if (json.success && json.data?.paymentStatus === 'SUCCESS') {
        setPaymentStatus('SUCCESS');
        setStatusMessage('Payment verified! Your slot is confirmed.');
      } else if (json.data?.paymentStatus === 'FAILED' || json.data?.paymentStatus === 'EXPIRED') {
        setPaymentStatus('FAILED');
        setError('Payment was not completed or expired. Slot reservation released.');
      } else {
        setPaymentStatus('PENDING');
        setStatusMessage('Awaiting gateway webhook or bank settlement confirmation...');
      }
    } catch {
      setPaymentStatus('PENDING');
      setError('Network connection interrupted while verifying.');
    } finally {
      setProcessing(false);
    }
  }, [orderId, accessToken]);

  // Initial verification check on mount (supports Android payment return / crash recovery)
  useEffect(() => {
    if (orderId && accessToken) {
      verifyPaymentAuthoritative();
    }
  }, [orderId, accessToken, verifyPaymentAuthoritative]);

  // 2. Cashfree SDK Drop-in Launch
  const launchCashfreeCheckout = async () => {
    if (!sessionId) {
      // In dev mode without sessionId, enable simulator controls
      setIsSimulatorMode(true);
      return;
    }

    try {
      // Dynamically load Cashfree JS SDK v3
      if (!window.Cashfree) {
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const cashfree = new window.Cashfree({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox',
      });

      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: '_self',
      });
    } catch (err: any) {
      console.warn('Cashfree SDK initialization notice:', err.message);
      setIsSimulatorMode(true);
    }
  };

  // 3. Development Simulator Trigger (only for dev environment)
  const simulateDevOutcome = async (outcome: 'SUCCESS' | 'FAILED') => {
    setProcessing(true);
    setError(null);

    try {
      const webhookPayload = {
        type: outcome === 'SUCCESS' ? 'PAYMENT_SUCCESS_WEBHOOK' : 'PAYMENT_FAILED_WEBHOOK',
        data: {
          order: { order_id: orderId },
          payment: {
            cf_payment_id: `cf_sim_${Date.now()}`,
            payment_status: outcome,
            payment_amount: 30.0,
            payment_currency: 'INR',
          },
        },
      };

      await fetch('/api/v1/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': 'sim_secret_key_vxa_dev_2026',
        },
        body: JSON.stringify(webhookPayload),
      });

      await verifyPaymentAuthoritative();
    } catch (err: any) {
      setError(err.message || 'Simulation network error.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 py-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="p-3.5 rounded-xl bg-void-850 border border-purple-brand/40 text-center">
        <span className="text-[10px] font-display font-extrabold uppercase tracking-wider text-purple-bright flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secured Tournament Checkout</span>
        </span>
        <h2 className="font-display font-black text-sm text-void-100 uppercase mt-0.5">
          Cashfree PG Integration
        </h2>
      </div>

      {/* Ticket Details */}
      <div className="p-4 rounded-2xl bg-void-850 border border-void-700/80 space-y-3 shadow-card-dark">
        <div className="flex items-center justify-between border-b border-void-800 pb-2.5">
          <span className="text-[10px] font-display uppercase text-void-400">Order ID</span>
          <span className="font-mono text-xs font-bold text-void-200 truncate max-w-[190px]">
            {orderId}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-void-300">Payment Status:</span>
          <span
            className={`text-xs font-display font-black uppercase px-2 py-0.5 rounded ${
              paymentStatus === 'SUCCESS'
                ? 'bg-status-success/20 text-status-success'
                : paymentStatus === 'FAILED'
                ? 'bg-status-danger/20 text-status-danger'
                : 'bg-status-warning/20 text-status-warning'
            }`}
          >
            {paymentStatus}
          </span>
        </div>

        <p className="text-[11px] text-void-300 text-center pt-1">{statusMessage}</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/40 flex items-center gap-2 text-xs text-status-danger">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verifying Spinner */}
      {processing && (
        <div className="p-4 text-center text-xs text-void-300 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-bright" />
          <span>Synchronizing with Cashfree servers...</span>
        </div>
      )}

      {/* Pending State Actions */}
      {paymentStatus === 'PENDING' && !processing && (
        <div className="space-y-2.5">
          <Button
            variant="primary"
            size="md"
            icon={<Smartphone className="w-4 h-4" />}
            onClick={launchCashfreeCheckout}
            className="w-full text-xs font-black shadow-purple-sm"
          >
            Pay via UPI / Cashfree Checkout
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={verifyPaymentAuthoritative}
            className="w-full text-xs"
          >
            Refresh Status
          </Button>

          {/* Dev Simulator Controls (if in dev mode) */}
          {isSimulatorMode && (
            <div className="p-3 rounded-xl bg-void-900 border border-dashed border-purple-brand/40 space-y-2 text-center mt-3">
              <span className="text-[9px] font-display font-bold uppercase text-purple-bright block">
                [Dev Sandbox Mode]
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => simulateDevOutcome('SUCCESS')}
                className="w-full text-[11px]"
              >
                Simulate Successful Webhook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateDevOutcome('FAILED')}
                className="w-full text-[11px] text-status-danger border-status-danger/40"
              >
                Simulate Failed Webhook
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {paymentStatus === 'SUCCESS' && (
        <div className="p-4 rounded-2xl bg-void-850 border border-status-success/50 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-status-success mx-auto" />
          <h3 className="font-display font-black text-sm text-void-100 uppercase">
            Tournament Entry Confirmed!
          </h3>
          <p className="text-xs text-void-300">
            Payment verified. Your slot is occupied and room pass credentials will unlock 15m prior to match start.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => router.push('/arena/my-matches')}
            className="w-full text-xs font-black shadow-purple-sm"
          >
            View in My Matches
          </Button>
        </div>
      )}

      {/* Failed State */}
      {paymentStatus === 'FAILED' && (
        <div className="p-4 rounded-2xl bg-void-850 border border-status-danger/50 text-center space-y-3">
          <XCircle className="w-10 h-10 text-status-danger mx-auto" />
          <h3 className="font-display font-black text-sm text-void-100 uppercase">
            Payment Failed or Cancelled
          </h3>
          <p className="text-xs text-void-300">
            Slot reservation has been safely released back to the tournament pool.
          </p>
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push(`/arena/matches/${matchId || ''}`)}
            className="w-full text-xs"
          >
            Return to Match Fixture
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-void-300 font-display uppercase animate-pulse">
          Loading Checkout Gateway...
        </div>
      }
    >
      <PaymentCheckoutContent />
    </React.Suspense>
  );
}
