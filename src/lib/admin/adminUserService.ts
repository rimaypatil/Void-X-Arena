import { prisma } from '@/lib/db/prisma';
import { UserStatus, Prisma } from '@prisma/client';
import { AdminAuditService } from '@/lib/audit/adminAudit';
import { WalletService } from '@/lib/wallet/walletService';

export class AdminUserService {
  /**
   * List registered contenders with wallet balances, match counts, and status.
   */
  static async listUsers(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: 'USER',
    };

    if (status && status !== 'ALL') {
      where.status = status as UserStatus;
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { username: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { gameUid: { contains: search.trim(), mode: 'insensitive' } },
        { gameName: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          wallet: true,
          _count: {
            select: {
              joinings: { where: { status: 'CONFIRMED' } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        fullName: u.fullName,
        gameUid: u.gameUid,
        gameName: u.gameName,
        status: u.status,
        role: u.role,
        wallet: {
          balance: Number(u.wallet?.balance || 0),
          winningBalance: Number(u.wallet?.winningBalance || 0),
          depositBalance: Number(u.wallet?.depositBalance || 0),
        },
        confirmedMatchesCount: u._count.joinings,
        createdAt: u.createdAt.toISOString(),
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
   * Retrieves full profile, ledger history, joinings, and results for a single contender.
   */
  static async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
          },
        },
        joinings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            match: { select: { id: true, title: true, status: true, matchDate: true } },
            payments: true,
          },
        },
        resultPlayers: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            matchResult: {
              include: {
                match: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    return {
      ...user,
      wallet: user.wallet
        ? {
            ...user.wallet,
            balance: Number(user.wallet.balance),
            winningBalance: Number(user.wallet.winningBalance),
            depositBalance: Number(user.wallet.depositBalance),
            bonusBalance: Number(user.wallet.bonusBalance),
            transactions: user.wallet.transactions.map((t) => ({
              ...t,
              amount: Number(t.amount),
              balanceBefore: Number(t.balanceBefore),
              balanceAfter: Number(t.balanceAfter),
              createdAt: t.createdAt.toISOString(),
            })),
          }
        : null,
    };
  }

  /**
   * Sets account status: ACTIVE, SUSPENDED, BANNED with audit trail.
   */
  static async updateUserStatus(params: {
    userId: string;
    status: UserStatus;
    reason: string;
    adminUserId: string;
  }) {
    const { userId, status, reason, adminUserId } = params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await AdminAuditService.record({
      action: 'USER_STATUS_UPDATED',
      actorId: adminUserId,
      entityType: 'USER',
      entityId: userId,
      details: {
        from: user.status,
        to: status,
        reason,
      },
    });

    return updated;
  }

  /**
   * Performs an authoritative manual wallet adjustment with mandatory reason and immutable audit log.
   */
  static async adjustWallet(params: {
    userId: string;
    amountDelta: number;
    reason: string;
    adminUserId: string;
  }) {
    const { userId, amountDelta, reason, adminUserId } = params;

    if (!reason || reason.trim().length < 5) {
      throw new Error('Manual wallet adjustment requires a detailed explanatory reason.');
    }

    return await prisma.$transaction(async (tx) => {
      const adjustmentTx = await WalletService.applyAdjustment({
        tx,
        userId,
        amountDelta,
        referenceType: 'MANUAL_ADMIN_ADJUSTMENT',
        referenceId: `ADMIN_${adminUserId}`,
        idempotencyKey: `MANUAL_ADJ_${userId}_${Date.now()}`,
        description: `Manual adjustment by admin: ${reason}`,
      });

      await AdminAuditService.record({
        action: 'WALLET_ADJUSTED',
        actorId: adminUserId,
        entityType: 'WALLET',
        entityId: userId,
        details: {
          amountDelta,
          reason,
          transactionId: adjustmentTx?.id,
        },
      });

      return adjustmentTx;
    });
  }
}
