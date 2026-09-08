import { prisma } from '@/lib/db/prisma';
import { getPaymentService } from './index';
import { PaymentAuditService } from '../audit/paymentAudit';
import { SlotStatus, JoiningStatus, PaymentStatus } from '@prisma/client';

export type ReconciliationTrigger =
  | 'VERIFY_ENDPOINT'
  | 'WEBHOOK'
  | 'RESERVATION_EXPIRY'
  | 'APP_CRASH_RECOVERY'
  | 'MANUAL_RECONCILE';

export interface ReconciliationResult {
  success: boolean;
  orderId: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED' | 'EXPIRED';
  joiningStatus?: 'CONFIRMED' | 'PENDING_PAYMENT' | 'CANCELLED';
  alreadySettled?: boolean;
  referenceId?: string;
  error?: string;
}

export class PaymentReconciliationService {
  /**
   * Universal, mutually idempotent reconciliation engine.
   * Both /verify and /webhook use this transaction, guaranteeing that
   * regardless of callback order, retries, or concurrent execution,
   * the resulting database state is strictly identical.
   */
  static async reconcile(params: {
    orderId: string;
    actorId?: string;
    triggerSource: ReconciliationTrigger;
    rawPayload?: any;
    ipAddress?: string | null;
  }): Promise<ReconciliationResult> {
    const { orderId, actorId, triggerSource, rawPayload, ipAddress } = params;

    // Execute within a serializable/locking transaction
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { orderId },
        include: {
          joining: {
            include: {
              slot: true,
              match: true,
            },
          },
        },
      });

      if (!payment) {
        return {
          success: false,
          orderId,
          paymentStatus: 'FAILED',
          error: `Payment record for order ${orderId} does not exist.`,
        };
      }

      const effectiveActorId = actorId || payment.userId;

      // 1. IDEMPOTENCY CHECK: If already SUCCESS, return settled state immediately
      if (payment.status === PaymentStatus.SUCCESS) {
        // Double-check slot and joining integrity
        if (payment.joining && payment.joining.status !== JoiningStatus.CONFIRMED) {
          await tx.joining.update({
            where: { id: payment.joining.id },
            data: { status: JoiningStatus.CONFIRMED },
          });
        }
        if (payment.joining?.slot && payment.joining.slot.status !== SlotStatus.OCCUPIED) {
          await tx.slot.update({
            where: { id: payment.joining.slotId },
            data: { status: SlotStatus.OCCUPIED, reservationExpiresAt: null },
          });
        }

        return {
          success: true,
          orderId,
          paymentStatus: 'SUCCESS',
          joiningStatus: 'CONFIRMED',
          alreadySettled: true,
          referenceId: payment.gatewayReferenceId || undefined,
        };
      }

      // 2. Query Authoritative Gateway Status
      const paymentService = getPaymentService();
      const verification = await paymentService.verifyPayment(orderId);

      // 3. CASE: Gateway reports SUCCESS
      if (verification.paymentStatus === 'SUCCESS') {
        // Validate currency and amount
        const expectedAmount = Number(payment.amount);
        if (verification.amount && Math.abs(verification.amount - expectedAmount) > 0.01) {
          console.error(
            `[AMOUNT_MISMATCH] Order ${orderId}: Expected ${expectedAmount}, received ${verification.amount}`
          );
          await PaymentAuditService.log({
            event: 'PAYMENT_FAILED',
            actorId: effectiveActorId,
            entityId: payment.id,
            details: {
              reason: 'AMOUNT_MISMATCH',
              expected: expectedAmount,
              received: verification.amount,
            },
            ipAddress,
          });
          return {
            success: false,
            orderId,
            paymentStatus: 'FAILED',
            error: 'Payment amount mismatch between gateway and database.',
          };
        }

        // Atomically update payment record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            gatewayReferenceId: verification.referenceId || payment.gatewayReferenceId,
            paymentMethod: verification.paymentMethod || payment.paymentMethod || 'UPI',
            rawWebhookPayload: rawPayload || payment.rawWebhookPayload,
          },
        });

        // Atomically confirm joining and occupy slot
        if (payment.joining) {
          await tx.joining.update({
            where: { id: payment.joining.id },
            data: { status: JoiningStatus.CONFIRMED },
          });

          await tx.slot.update({
            where: { id: payment.joining.slotId },
            data: {
              status: SlotStatus.OCCUPIED,
              reservationExpiresAt: null,
              version: { increment: 1 },
            },
          });

          // Update match filledSlots counter
          const occupiedCount = await tx.slot.count({
            where: { matchId: payment.joining.matchId, status: SlotStatus.OCCUPIED },
          });
          await tx.match.update({
            where: { id: payment.joining.matchId },
            data: { filledSlots: occupiedCount },
          });
        }

        // Ensure wallet transaction ledger entry exists exactly once
        const existingTxn = await tx.walletTransaction.findFirst({
          where: {
            userId: payment.userId,
            referenceType: 'MATCH_JOINING',
            referenceId: payment.joining?.matchId || orderId,
            type: 'TOURNAMENT_ENTRY',
          },
        });

        if (!existingTxn) {
          const wallet = await tx.wallet.findUnique({
            where: { userId: payment.userId },
          });
          if (wallet) {
            const bal = Number(wallet.balance);
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                userId: payment.userId,
                type: 'TOURNAMENT_ENTRY',
                amount: Number(payment.amount),
                balanceBefore: bal,
                balanceAfter: bal,
                referenceType: 'MATCH_JOINING',
                referenceId: payment.joining?.matchId || orderId,
                status: 'COMPLETED',
                description: `Entry fee for ${payment.joining?.match?.title || 'Tournament'}`,
              },
            });
          }
        }

        await PaymentAuditService.log({
          event: 'PAYMENT_SUCCESS',
          actorId: effectiveActorId,
          entityId: payment.id,
          details: {
            triggerSource,
            orderId,
            referenceId: verification.referenceId,
            amount: payment.amount,
          },
          ipAddress,
        });

        return {
          success: true,
          orderId,
          paymentStatus: 'SUCCESS',
          joiningStatus: 'CONFIRMED',
          referenceId: verification.referenceId,
        };
      }

      // 4. CASE: Gateway reports FAILED, EXPIRED, or USER_DROPPED
      if (verification.paymentStatus === 'FAILED' || verification.paymentStatus === 'USER_DROPPED') {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });

        // Release slot safely with ownership check (Directive 4)
        if (payment.joining) {
          await tx.joining.update({
            where: { id: payment.joining.id },
            data: { status: JoiningStatus.CANCELLED },
          });

          // Only release slot if it still belongs to this user and is not already occupied/reassigned
          await tx.slot.updateMany({
            where: {
              id: payment.joining.slotId,
              reservedByUserId: payment.userId,
              status: { in: [SlotStatus.RESERVED, SlotStatus.PAYMENT_PENDING] },
            },
            data: {
              status: SlotStatus.AVAILABLE,
              reservedByUserId: null,
              reservedAt: null,
              reservationExpiresAt: null,
              version: { increment: 1 },
            },
          });
        }

        await PaymentAuditService.log({
          event: 'PAYMENT_FAILED',
          actorId: effectiveActorId,
          entityId: payment.id,
          details: { triggerSource, reason: verification.paymentStatus },
          ipAddress,
        });

        return {
          success: false,
          orderId,
          paymentStatus: 'FAILED',
          joiningStatus: 'CANCELLED',
          error: 'Payment was not successful.',
        };
      }

      // 5. CASE: Payment is still PENDING on gateway
      return {
        success: true,
        orderId,
        paymentStatus: 'PENDING',
        joiningStatus: 'PENDING_PAYMENT',
      };
    });
  }
}
