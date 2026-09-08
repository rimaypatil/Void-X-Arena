import { prisma } from '@/lib/db/prisma';
import { getPaymentService } from '@/lib/payments';
import { PaymentAuditService } from '@/lib/audit/paymentAudit';
import { MatchStatus, JoiningStatus, SlotStatus, RefundStatus } from '@prisma/client';
import crypto from 'crypto';

export interface CancelMatchResult {
  success: boolean;
  matchId: string;
  totalJoiningsRefunded: number;
  totalRefundAmount: number;
  failures: Array<{ joiningId: string; error: string }>;
}

export class MatchCancellationService {
  /**
   * Authoritative admin match cancellation with automated refund workflow.
   * Cancels match, iterates all confirmed joinings, calls gateway refund, and updates ledger.
   */
  static async cancelMatchWithRefunds(params: {
    matchId: string;
    adminUserId: string;
    reason: string;
  }): Promise<CancelMatchResult> {
    const { matchId, adminUserId, reason } = params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        joinings: {
          where: { status: JoiningStatus.CONFIRMED },
          include: {
            payments: {
              where: { status: 'SUCCESS' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            user: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found.`);
    }

    if (match.status === MatchStatus.CANCELLED) {
      throw new Error(`Match ${matchId} is already cancelled.`);
    }

    // 1. Mark match as CANCELLED
    await prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.CANCELLED },
    });

    const paymentService = getPaymentService();
    let totalRefunded = 0;
    let totalRefundAmount = 0;
    const failures: Array<{ joiningId: string; error: string }> = [];

    // 2. Iterate through each confirmed joining and process gateway refund
    for (const joining of match.joinings) {
      const payment = joining.payments[0];
      if (!payment) {
        failures.push({ joiningId: joining.id, error: 'No successful payment record found' });
        continue;
      }

      const refundId = `RF_${payment.orderId}_${crypto.randomBytes(3).toString('hex')}`;
      const amountToRefund = Number(payment.amount);

      // Create initial refund record
      const refundRecord = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          userId: joining.userId,
          amount: amountToRefund,
          reason,
          status: RefundStatus.REFUND_PENDING,
        },
      });

      await PaymentAuditService.log({
        event: 'REFUND_CREATED',
        actorId: adminUserId,
        actorRole: 'ADMIN',
        entityId: refundRecord.id,
        details: { matchId, orderId: payment.orderId, amount: amountToRefund },
      });

      try {
        // Gateway call
        const gatewayRefund = await paymentService.refundPayment({
          orderId: payment.orderId,
          refundId,
          refundAmount: amountToRefund,
          reason: `Match Cancelled: ${reason}`,
        });

        if (gatewayRefund.status === 'REFUNDED') {
          await prisma.refund.update({
            where: { id: refundRecord.id },
            data: {
              status: RefundStatus.REFUNDED,
              gatewayRefundId: gatewayRefund.gatewayRefundId,
              processedAt: new Date(),
            },
          });

          await prisma.joining.update({
            where: { id: joining.id },
            data: { status: JoiningStatus.REFUNDED },
          });

          // Ledger entry ONLY created upon authoritative gateway REFUNDED confirmation
          const userWallet = await prisma.wallet.findUnique({
            where: { userId: joining.userId },
          });
          if (userWallet) {
            const bal = Number(userWallet.balance);
            await prisma.walletTransaction.create({
              data: {
                walletId: userWallet.id,
                userId: joining.userId,
                type: 'REFUND',
                amount: amountToRefund,
                balanceBefore: bal,
                balanceAfter: bal, // Gateway UPI refund to source payment method
                referenceType: 'MATCH_CANCELLATION',
                referenceId: matchId,
                status: 'COMPLETED',
                idempotencyKey: `REFUND_${payment.id}`,
                description: `Refund for cancelled match: ${match.title}`,
              },
            });
          }

          await PaymentAuditService.log({
            event: 'REFUND_SUCCESS',
            actorId: adminUserId,
            actorRole: 'ADMIN',
            entityId: refundRecord.id,
            details: { gatewayRefundId: gatewayRefund.gatewayRefundId, paymentId: payment.id },
          });

          totalRefunded++;
          totalRefundAmount += amountToRefund;
        } else if (gatewayRefund.status === 'REFUND_PENDING') {
          // Asynchronous gateway processing: ledger remains untouched until webhook/inquiry confirms REFUNDED
          await prisma.refund.update({
            where: { id: refundRecord.id },
            data: {
              status: RefundStatus.REFUND_PENDING,
              gatewayRefundId: gatewayRefund.gatewayRefundId,
            },
          });
          await prisma.joining.update({
            where: { id: joining.id },
            data: { status: JoiningStatus.REFUND_PENDING },
          });

          await PaymentAuditService.log({
            event: 'REFUND_PENDING',
            actorId: adminUserId,
            actorRole: 'ADMIN',
            entityId: refundRecord.id,
            details: { gatewayRefundId: gatewayRefund.gatewayRefundId, status: 'AWAITING_GATEWAY_SETTLEMENT' },
          });
        } else {
          await prisma.refund.update({
            where: { id: refundRecord.id },
            data: { status: RefundStatus.REFUND_FAILED },
          });
          failures.push({ joiningId: joining.id, error: 'Gateway returned REFUND_FAILED' });
        }
      } catch (err: any) {
        await prisma.refund.update({
          where: { id: refundRecord.id },
          data: { status: RefundStatus.REFUND_FAILED },
        });
        failures.push({ joiningId: joining.id, error: err.message });
      }
    }

    // 3. Release all slots back to AVAILABLE
    await prisma.slot.updateMany({
      where: { matchId },
      data: {
        status: SlotStatus.AVAILABLE,
        reservedByUserId: null,
        reservedAt: null,
        reservationExpiresAt: null,
      },
    });

    return {
      success: failures.length === 0,
      matchId,
      totalJoiningsRefunded: totalRefunded,
      totalRefundAmount,
      failures,
    };
  }
}
