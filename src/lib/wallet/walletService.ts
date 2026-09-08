import { prisma } from '@/lib/db/prisma';
import { Prisma, TransactionType, TransactionStatus } from '@prisma/client';

export interface WalletBalanceSummary {
  id: string;
  userId: string;
  balance: number;
  winningBalance: number;
  depositBalance: number;
  bonusBalance: number;
  currency: string;
}

export class WalletService {
  /**
   * Core Wallet Accounting Invariant:
   * balance (spendable total) = depositBalance + winningBalance + bonusBalance.
   */
  static validateInvariant(wallet: {
    balance: Prisma.Decimal | number;
    winningBalance: Prisma.Decimal | number;
    depositBalance: Prisma.Decimal | number;
    bonusBalance: Prisma.Decimal | number;
  }): boolean {
    const total = Number(wallet.balance);
    const sum =
      Number(wallet.depositBalance) +
      Number(wallet.winningBalance) +
      Number(wallet.bonusBalance);
    // Float comparison tolerance
    return Math.abs(total - sum) < 0.01;
  }

  /**
   * Retrieves authoritative wallet for a user, provisioning one if not yet present.
   */
  static async getWallet(userId: string, tx: Prisma.TransactionClient = prisma): Promise<WalletBalanceSummary> {
    let wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          balance: 0,
          winningBalance: 0,
          depositBalance: 0,
          bonusBalance: 0,
          currency: 'INR',
        },
      });
    }

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: Number(wallet.balance),
      winningBalance: Number(wallet.winningBalance),
      depositBalance: Number(wallet.depositBalance),
      bonusBalance: Number(wallet.bonusBalance),
      currency: wallet.currency,
    };
  }

  /**
   * Concurrency-safe, atomic prize credit inside an active database transaction.
   * Locks wallet, ensures idempotency, maintains invariant, and appends immutable ledger entry.
   */
  static async creditPrize(params: {
    tx: Prisma.TransactionClient;
    userId: string;
    amount: number;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
    description: string;
  }) {
    const { tx, userId, amount, referenceType, referenceId, idempotencyKey, description } = params;

    if (amount <= 0) {
      return null;
    }

    // Check if this exact prize transaction was already settled
    const existing = await tx.walletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return existing;
    }

    // Ensure wallet exists
    await this.getWallet(userId, tx);

    // Row-level lock / re-read wallet inside the transaction
    const [lockedWallet] = await tx.$queryRaw<Array<{
      id: string;
      balance: Prisma.Decimal;
      winning_balance: Prisma.Decimal;
      deposit_balance: Prisma.Decimal;
      bonus_balance: Prisma.Decimal;
    }>>`SELECT id, balance, "winningBalance" as winning_balance, "depositBalance" as deposit_balance, "bonusBalance" as bonus_balance FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE`;

    const balanceBefore = Number(lockedWallet.balance);
    const balanceAfter = Number((balanceBefore + amount).toFixed(2));
    const newWinningBalance = Number((Number(lockedWallet.winning_balance) + amount).toFixed(2));

    // Update wallet
    await tx.wallet.update({
      where: { id: lockedWallet.id },
      data: {
        balance: balanceAfter,
        winningBalance: newWinningBalance,
      },
    });

    // Create immutable ledger entry
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: lockedWallet.id,
        userId,
        type: TransactionType.PRIZE_WIN,
        amount,
        balanceBefore,
        balanceAfter,
        referenceType,
        referenceId,
        status: TransactionStatus.COMPLETED,
        idempotencyKey,
        description,
      },
    });

    return transaction;
  }

  /**
   * Compensating adjustment for administrative corrections.
   * Produces a new auditable ADJUSTMENT transaction without mutating past ledger records.
   */
  static async applyAdjustment(params: {
    tx: Prisma.TransactionClient;
    userId: string;
    amountDelta: number; // Positive = credit, negative = debit
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
    description: string;
  }) {
    const { tx, userId, amountDelta, referenceType, referenceId, idempotencyKey, description } = params;

    if (amountDelta === 0) {
      return null;
    }

    const existing = await tx.walletTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return existing;
    }

    await this.getWallet(userId, tx);

    const [lockedWallet] = await tx.$queryRaw<Array<{
      id: string;
      balance: Prisma.Decimal;
      winning_balance: Prisma.Decimal;
      deposit_balance: Prisma.Decimal;
      bonus_balance: Prisma.Decimal;
    }>>`SELECT id, balance, "winningBalance" as winning_balance, "depositBalance" as deposit_balance, "bonusBalance" as bonus_balance FROM "Wallet" WHERE "userId" = ${userId} FOR UPDATE`;

    const balanceBefore = Number(lockedWallet.balance);
    const balanceAfter = Math.max(0, Number((balanceBefore + amountDelta).toFixed(2)));
    const winningBefore = Number(lockedWallet.winning_balance);
    const newWinningBalance = Math.max(0, Number((winningBefore + amountDelta).toFixed(2)));

    await tx.wallet.update({
      where: { id: lockedWallet.id },
      data: {
        balance: balanceAfter,
        winningBalance: newWinningBalance,
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: lockedWallet.id,
        userId,
        type: TransactionType.ADJUSTMENT,
        amount: Math.abs(amountDelta),
        balanceBefore,
        balanceAfter,
        referenceType,
        referenceId,
        status: TransactionStatus.COMPLETED,
        idempotencyKey,
        description: `${description} (${amountDelta > 0 ? '+' : ''}₹${amountDelta.toFixed(2)})`,
      },
    });

    return transaction;
  }

  /**
   * Paginated ledger transactions with filtering
   */
  static async getTransactions(params: {
    userId: string;
    filter?: 'ALL' | 'ENTRIES' | 'WINNINGS' | 'REFUNDS' | 'ADJUSTMENTS';
    page?: number;
    limit?: number;
  }) {
    const { userId, filter = 'ALL', page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WalletTransactionWhereInput = { userId };

    if (filter === 'ENTRIES') {
      where.type = TransactionType.TOURNAMENT_ENTRY;
    } else if (filter === 'WINNINGS') {
      where.type = TransactionType.PRIZE_WIN;
    } else if (filter === 'REFUNDS') {
      where.type = TransactionType.REFUND;
    } else if (filter === 'ADJUSTMENTS') {
      where.type = TransactionType.ADJUSTMENT;
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        status: t.status,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
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
