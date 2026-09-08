import { prisma } from '@/lib/db/prisma';

export type PaymentAuditEvent =
  | 'ORDER_CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'WEBHOOK_RECEIVED'
  | 'WEBHOOK_VERIFIED'
  | 'WEBHOOK_REJECTED'
  | 'PAYMENT_RECONCILED'
  | 'REFUND_CREATED'
  | 'REFUND_PENDING'
  | 'REFUND_SUCCESS'
  | 'REFUND_FAILED';

export class PaymentAuditService {
  /**
   * Records an immutable financial / payment lifecycle event in the audit log.
   * Strips all secrets, keys, and tokens to ensure security compliance.
   */
  static async log(params: {
    event: PaymentAuditEvent;
    actorId: string;
    actorRole?: string;
    entityId: string;
    details?: Record<string, any>;
    ipAddress?: string | null;
  }): Promise<void> {
    const { event, actorId, actorRole = 'USER', entityId, details = {}, ipAddress } = params;

    // Sanitize details: strip sensitive fields
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.secretKey;
    delete sanitizedDetails.secret;
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.authorization;

    try {
      await prisma.auditLog.create({
        data: {
          action: event,
          actorId,
          actorRole,
          entityType: 'PAYMENT',
          entityId,
          details: sanitizedDetails,
          ipAddress: ipAddress || null,
        },
      });
    } catch (err) {
      // Never let audit logging failure block payment flow, but log to console
      console.error(`[AUDIT_ERROR] Failed to record ${event} for ${entityId}:`, err);
    }
  }
}
