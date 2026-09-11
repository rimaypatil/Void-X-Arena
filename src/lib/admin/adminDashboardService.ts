import { prisma } from '@/lib/db/prisma';
import { MatchStatus, PaymentStatus, RefundStatus, ResultStatus, TransactionType } from '@prisma/client';

export class AdminDashboardService {
  /**
   * Authoritative real-time operational statistics aggregated strictly from the database.
   * Zero mock or simulated figures.
   */
  static async getOperationalSummary() {
    const [
      totalMatches,
      upcomingMatches,
      ongoingMatches,
      resultedMatches,
      cancelledMatches,
      totalPlayers,
      activeJoinings,
      pendingPaymentsCount,
      pendingRefundsCount,
      ongoingMatchesWithoutResults,
      successfulPayments,
      distributedPrizes,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.match.count(),
      prisma.match.count({ where: { status: MatchStatus.UPCOMING } }),
      prisma.match.count({ where: { status: MatchStatus.ONGOING } }),
      prisma.match.count({ where: { status: MatchStatus.RESULTED } }),
      prisma.match.count({ where: { status: MatchStatus.CANCELLED } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.joining.count({ where: { status: 'CONFIRMED' } }),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      prisma.refund.count({ where: { status: RefundStatus.REFUND_PENDING } }),
      prisma.match.count({
        where: {
          status: MatchStatus.ONGOING,
          OR: [
            { result: null },
            { result: { status: ResultStatus.DRAFT } },
          ],
        },
      }),
      // Sum of successful entry fee payments
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
      // Sum of prize payouts settled to contender wallets
      prisma.walletTransaction.aggregate({
        where: { type: TransactionType.PRIZE_WIN, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      // Recent audit trail events
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { username: true, role: true } },
        },
      }),
    ]);

    const totalRevenue = Number(successfulPayments._sum.amount || 0);
    const totalPrizesDistributed = Number(distributedPrizes._sum.amount || 0);

    return {
      matches: {
        total: totalMatches,
        upcoming: upcomingMatches,
        ongoing: ongoingMatches,
        resulted: resultedMatches,
        cancelled: cancelledMatches,
        pendingResults: ongoingMatchesWithoutResults,
      },
      players: {
        total: totalPlayers,
        confirmedJoinings: activeJoinings,
      },
      financials: {
        totalRevenue,
        totalPrizesDistributed,
        netPlatformMargin: Number((totalRevenue - totalPrizesDistributed).toFixed(2)),
        pendingPaymentsCount,
        pendingRefundsCount,
      },
      recentActivity: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actor: log.user?.username || log.actorId,
        actorRole: log.actorRole,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }
}
