import { prisma } from '@/lib/db/prisma';
import { PaymentStatus, RefundStatus, Prisma } from '@prisma/client';
import { AdminAuditService } from '@/lib/audit/adminAudit';

export class AdminFinanceService {
  /**
   * Authoritative payments ledger inspector.
   * Strips all gateway secret keys while providing complete transaction transparency.
   */
  static async listPayments(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 25 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (status && status !== 'ALL') {
      where.status = status as PaymentStatus;
    }
    if (search && search.trim().length > 0) {
      where.OR = [
        { orderId: { contains: search.trim(), mode: 'insensitive' } },
        { gatewayReferenceId: { contains: search.trim(), mode: 'insensitive' } },
        { userId: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          joining: {
            select: {
              id: true,
              inGameName: true,
              inGameId: true,
              match: {
                select: { id: true, title: true, contestId: true },
              },
            },
          },
          refunds: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        userId: p.userId,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        gatewayName: p.gatewayName,
        gatewayReferenceId: p.gatewayReferenceId,
        referenceType: p.referenceType,
        referenceId: p.referenceId,
        match: p.joining?.match || null,
        contender: p.joining ? { inGameName: p.joining.inGameName, inGameId: p.joining.inGameId } : null,
        hasRefund: p.refunds.length > 0,
        refundStatus: p.refunds[0]?.status || null,
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Authoritative refund ledger inspector.
   */
  static async listRefunds(params: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 25 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RefundWhereInput = {};
    if (status && status !== 'ALL') {
      where.status = status as RefundStatus;
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          payment: {
            include: {
              joining: {
                select: {
                  inGameName: true,
                  inGameId: true,
                  match: { select: { id: true, title: true, contestId: true } },
                },
              },
            },
          },
        },
      }),
      prisma.refund.count({ where }),
    ]);

    return {
      refunds: refunds.map((r) => ({
        id: r.id,
        paymentId: r.paymentId,
        orderId: r.payment?.orderId,
        userId: r.userId,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        gatewayRefundId: r.gatewayRefundId,
        processedAt: r.processedAt ? r.processedAt.toISOString() : null,
        match: r.payment?.joining?.match || null,
        contender: r.payment?.joining
          ? { inGameName: r.payment.joining.inGameName, inGameId: r.payment.joining.inGameId }
          : null,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
