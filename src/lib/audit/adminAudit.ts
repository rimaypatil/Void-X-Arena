import { prisma } from '@/lib/db/prisma';

export type AdminAuditEvent =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'MATCH_PUBLISHED'
  | 'MATCH_UNPUBLISHED'
  | 'MATCH_STARTED'
  | 'MATCH_SUSPENDED'
  | 'MATCH_CANCELLED'
  | 'ROOM_CREDENTIALS_UPDATED'
  | 'RULE_CREATED'
  | 'RULE_UPDATED'
  | 'RULE_DELETED'
  | 'GAME_CREATED'
  | 'GAME_UPDATED'
  | 'GAME_DELETED'
  | 'RESULT_DRAFTED'
  | 'RESULT_PUBLISHED'
  | 'RESULT_CORRECTED'
  | 'USER_STATUS_UPDATED'
  | 'WALLET_ADJUSTED'
  | 'BANNER_CREATED'
  | 'BANNER_UPDATED'
  | 'BANNER_DELETED'
  | 'SETTINGS_UPDATED'
  | 'REFUND_PROCESSED';

export class AdminAuditService {
  /**
   * Authoritative immutable audit trail for administrative operations.
   * Strips any sensitive credentials before recording.
   */
  static async record(params: {
    action: AdminAuditEvent;
    actorId: string;
    actorRole?: string;
    entityType: 'MATCH' | 'GAME' | 'RESULT' | 'USER' | 'WALLET' | 'BANNER' | 'APP_SETTING' | 'PAYMENT' | 'MATCH_RULE';
    entityId: string;
    details?: Record<string, any>;
    ipAddress?: string | null;
  }): Promise<void> {
    const { action, actorId, actorRole = 'ADMIN', entityType, entityId, details = {}, ipAddress } = params;

    const sanitizedDetails: Record<string, any> = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.passwordHash;
    delete sanitizedDetails.secretKey;
    delete sanitizedDetails.token;
    delete sanitizedDetails.authorization;
    delete sanitizedDetails.secret;

    try {
      await prisma.auditLog.create({
        data: {
          action,
          actorId,
          actorRole,
          entityType,
          entityId,
          details: sanitizedDetails,
          ipAddress: ipAddress || null,
        },
      });
    } catch (err) {
      console.error(`[ADMIN_AUDIT_ERROR] Failed to record ${action} on ${entityType}:${entityId}`, err);
    }
  }
}
