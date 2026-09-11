import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { PaymentStatus, JoiningStatus, TransactionType, TransactionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const now = Date.now();
    const twoMinutesAgo = new Date(now - 2 * 60 * 1000);
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000);

    // 1. Scan successful payments
    const successfulPayments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.SUCCESS,
      },
      include: {
        joining: {
          select: {
            id: true,
            status: true,
            inGameName: true,
            slotId: true,
            matchId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const paymentDiscrepancies: Array<{
      orderId: string;
      userId: string;
      amount: number;
      createdAt: string;
      ageSeconds: number;
      severity: 'INFORMATIONAL' | 'WARNING' | 'CRITICAL';
      reason: string;
    }> = [];

    let informationalCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    for (const payment of successfulPayments) {
      const isUnconfirmed = !payment.joining || payment.joining.status !== JoiningStatus.CONFIRMED;
      if (isUnconfirmed) {
        const paymentAgeMs = now - payment.createdAt.getTime();
        const ageSeconds = Math.floor(paymentAgeMs / 1000);

        let severity: 'INFORMATIONAL' | 'WARNING' | 'CRITICAL';
        if (payment.createdAt > twoMinutesAgo) {
          severity = 'INFORMATIONAL';
          informationalCount++;
        } else if (payment.createdAt > tenMinutesAgo) {
          severity = 'WARNING';
          warningCount++;
        } else {
          severity = 'CRITICAL';
          criticalCount++;
        }

        paymentDiscrepancies.push({
          orderId: payment.orderId,
          userId: payment.userId,
          amount: Number(payment.amount),
          createdAt: payment.createdAt.toISOString(),
          ageSeconds,
          severity,
          reason: !payment.joining
            ? 'Successful gateway payment has no linked joining record'
            : `Linked joining is in ${payment.joining.status} status instead of CONFIRMED`,
        });
      }
    }

    // 2. Scan wallets for Transactional Ledger Balance Reconstruction Invariant
    // wallet.balance == initial_balance (0) + Σ credits - Σ debits
    const wallets = await prisma.wallet.findMany({
      include: {
        transactions: {
          where: { status: TransactionStatus.COMPLETED },
        },
      },
      take: 100,
    });

    const walletViolations: Array<{
      walletId: string;
      userId: string;
      storedBalance: number;
      reconstructedBalance: number;
      drift: number;
    }> = [];

    for (const wallet of wallets) {
      const storedBalance = Number(wallet.balance);
      let reconstructed = 0;

      for (const tx of wallet.transactions) {
        const amount = Number(tx.amount);
        switch (tx.type) {
          case TransactionType.PRIZE_WIN:
          case TransactionType.REFUND:
            reconstructed += amount;
            break;
          case TransactionType.TOURNAMENT_ENTRY:
          case TransactionType.WITHDRAWAL:
            reconstructed -= amount;
            break;
          case TransactionType.ADJUSTMENT:
            // Adjustments can increase or decrease balance based on balanceAfter vs balanceBefore
            const delta = Number(tx.balanceAfter) - Number(tx.balanceBefore);
            reconstructed += delta;
            break;
        }
      }

      // Check drift tolerance (float precision)
      const drift = Math.abs(storedBalance - reconstructed);
      if (drift > 0.01) {
        walletViolations.push({
          walletId: wallet.id,
          userId: wallet.userId,
          storedBalance,
          reconstructedBalance: Number(reconstructed.toFixed(2)),
          drift: Number(drift.toFixed(2)),
        });
      }
    }

    const isHealthy = criticalCount === 0 && walletViolations.length === 0;

    return Api.success({
      status: isHealthy ? 'HEALTHY' : 'DRIFT_DETECTED',
      timestamp: new Date().toISOString(),
      summary: {
        totalPaymentsScanned: successfulPayments.length,
        cleanPayments: successfulPayments.length - paymentDiscrepancies.length,
        informationalLagCount: informationalCount,
        warningCount: warningCount,
        criticalDiscrepancyCount: criticalCount,
        walletsScanned: wallets.length,
        walletInvariantViolationsCount: walletViolations.length,
      },
      paymentDiscrepancies,
      walletViolations,
    });
  } catch (error: any) {
    return Api.serverError('Reconciliation scan failed', error.message);
  }
}
