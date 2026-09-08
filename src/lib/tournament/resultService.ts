import { prisma } from '@/lib/db/prisma';
import {
  MatchStatus,
  JoiningStatus,
  ResultStatus,
  TransactionType,
  Prisma,
} from '@prisma/client';
import { WalletService } from '@/lib/wallet/walletService';

export interface ResultPlayerInput {
  joiningId?: string;
  inGameId?: string;
  userId?: string;
  rank: number;
  kills: number;
}

export interface SaveResultDraftParams {
  matchId: string;
  adminUserId: string;
  players: ResultPlayerInput[];
  summary?: string;
}

export interface PublishResultParams {
  matchId: string;
  adminUserId: string;
  players?: ResultPlayerInput[]; // Optional: if provided, validates & publishes in one atomic step
  summary?: string;
}

export interface CorrectResultParams {
  matchId: string;
  adminUserId: string;
  reason: string;
  players: ResultPlayerInput[];
  summary?: string;
}

export class ResultService {
  /**
   * Canonical prize distribution parser.
   * Extracts a deterministic rank -> prize map regardless of whether prizeDistribution
   * is formatted as an object { "1": 1000 } or an array [{ rank: 1, prize: 1000 }] or [{ rank: "1st Place", amount: "₹1,000" }].
   */
  static parsePrizeDistribution(distribution: any): Map<number, number> {
    const prizeMap = new Map<number, number>();
    if (!distribution) return prizeMap;

    if (Array.isArray(distribution)) {
      for (const item of distribution) {
        let rankNum: number | null = null;
        let amountNum = 0;

        if (typeof item.rank === 'number') {
          rankNum = item.rank;
        } else if (typeof item.rank === 'string') {
          const match = item.rank.match(/\d+/);
          if (match) {
            rankNum = parseInt(match[0], 10);
          }
        }

        if (typeof item.prize === 'number') {
          amountNum = item.prize;
        } else if (typeof item.amount === 'number') {
          amountNum = item.amount;
        } else if (typeof item.amount === 'string') {
          const cleaned = item.amount.replace(/[^0-9.]/g, '');
          if (cleaned) amountNum = parseFloat(cleaned);
        }

        if (rankNum !== null && !isNaN(amountNum) && amountNum > 0) {
          prizeMap.set(rankNum, Number(amountNum.toFixed(2)));
        }
      }
    } else if (typeof distribution === 'object') {
      for (const [key, val] of Object.entries(distribution)) {
        const rankNum = parseInt(key, 10);
        if (!isNaN(rankNum)) {
          const amountNum = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
          if (!isNaN(amountNum) && amountNum > 0) {
            prizeMap.set(rankNum, Number(amountNum.toFixed(2)));
          }
        }
      }
    }

    return prizeMap;
  }

  /**
   * Validates result inputs against the match, rules, and confirmed joinings.
   * Server strictly calculates placement prize, kill bounty, and total prize.
   */
  static async validateAndCalculateResults(params: {
    matchId: string;
    players: ResultPlayerInput[];
    tx?: Prisma.TransactionClient;
  }) {
    const client = params.tx || prisma;
    const { matchId, players } = params;

    const match = await client.match.findUnique({
      where: { id: matchId },
      include: {
        joinings: {
          where: { status: JoiningStatus.CONFIRMED },
        },
      },
    });

    if (!match) {
      throw new Error(`Match ${matchId} does not exist.`);
    }

    if (match.status === MatchStatus.CANCELLED) {
      throw new Error(`Cannot submit results for CANCELLED match ${matchId}.`);
    }

    if (!players || players.length === 0) {
      throw new Error('At least one participant result is required.');
    }

    const prizeMap = this.parsePrizeDistribution(match.prizeDistribution);
    const perKillRate = Number(match.perKillPrize || 0);
    const maxPrizePool = Number(match.prizeAmount);

    // Validate placement rules against prize pool
    let totalConfiguredPlacements = 0;
    prizeMap.forEach((amt) => {
      totalConfiguredPlacements += amt;
    });
    if (totalConfiguredPlacements > maxPrizePool + 0.01) {
      throw new Error(
        `Configured placement prizes (₹${totalConfiguredPlacements}) exceed match prize pool (₹${maxPrizePool}).`
      );
    }

    const seenRanks = new Set<number>();
    const seenUserIds = new Set<string>();
    const seenJoiningIds = new Set<string>();

    const calculatedPlayers: Array<{
      userId: string;
      joiningId: string;
      inGameName: string;
      rank: number;
      kills: number;
      prizeAmount: number;
      killPrizeAmount: number;
      totalPrizeAmount: number;
      isWinner: boolean;
    }> = [];

    let totalAwardedPrize = 0;

    for (const input of players) {
      // 1. Rank validation
      if (!Number.isInteger(input.rank) || input.rank < 1) {
        throw new Error(`Invalid rank: ${input.rank}. Rank must be an integer >= 1.`);
      }
      if (seenRanks.has(input.rank)) {
        throw new Error(`Duplicate rank detected: Rank ${input.rank} assigned multiple times.`);
      }
      seenRanks.add(input.rank);

      // 2. Kills validation
      if (!Number.isInteger(input.kills) || input.kills < 0) {
        throw new Error(`Invalid kills: ${input.kills}. Kills must be a non-negative integer.`);
      }

      // 3. Resolve participant to a CONFIRMED joining
      const matchedJoining = match.joinings.find((j) => {
        if (input.joiningId && j.id === input.joiningId) return true;
        if (input.inGameId && j.inGameId === input.inGameId) return true;
        if (input.userId && j.userId === input.userId) return true;
        return false;
      });

      if (!matchedJoining) {
        throw new Error(
          `Invalid participant: Participant (rank ${input.rank}) does not correspond to any CONFIRMED joining in match ${matchId}.`
        );
      }

      if (seenUserIds.has(matchedJoining.userId) || seenJoiningIds.has(matchedJoining.id)) {
        throw new Error(
          `Duplicate participant: Player ${matchedJoining.inGameName} (${matchedJoining.userId}) appears multiple times in result submission.`
        );
      }
      seenUserIds.add(matchedJoining.userId);
      seenJoiningIds.add(matchedJoining.id);

      // 4. Server-Authoritative Prize Calculations (Zero Client Authority)
      const placementPrize = prizeMap.get(input.rank) || 0;
      const killPrize = Number((perKillRate * input.kills).toFixed(2));
      const totalPrize = Number((placementPrize + killPrize).toFixed(2));

      totalAwardedPrize = Number((totalAwardedPrize + totalPrize).toFixed(2));

      calculatedPlayers.push({
        userId: matchedJoining.userId,
        joiningId: matchedJoining.id,
        inGameName: matchedJoining.inGameName,
        rank: input.rank,
        kills: input.kills,
        prizeAmount: placementPrize,
        killPrizeAmount: killPrize,
        totalPrizeAmount: totalPrize,
        isWinner: input.rank === 1,
      });
    }

    // 5. Total awarded prize overflow check
    if (totalAwardedPrize > maxPrizePool + 0.01) {
      throw new Error(
        `Total distributed prizes (₹${totalAwardedPrize}) exceed configured match prize pool (₹${maxPrizePool}).`
      );
    }

    return {
      match,
      calculatedPlayers,
      totalAwardedPrize,
      prizeMap,
    };
  }

  /**
   * Creates or updates a DRAFT result.
   * Drafts do NOT move money, do NOT alter user wallets, and do NOT alter the leaderboard.
   */
  static async saveDraft(params: SaveResultDraftParams) {
    const { matchId, adminUserId, players, summary } = params;

    const { match, calculatedPlayers } = await this.validateAndCalculateResults({
      matchId,
      players,
    });

    return await prisma.$transaction(async (tx) => {
      // Transition match to ONGOING if still UPCOMING
      if (match.status === MatchStatus.UPCOMING) {
        await tx.match.update({
          where: { id: matchId },
          data: { status: MatchStatus.ONGOING },
        });
      }

      // Upsert MatchResult as DRAFT
      let matchResult = await tx.matchResult.findUnique({
        where: { matchId },
      });

      if (matchResult && matchResult.status === ResultStatus.PUBLISHED) {
        throw new Error(
          `Match ${matchId} has already been PUBLISHED. Use the correction workflow to make amendments.`
        );
      }

      if (matchResult) {
        // Delete previous draft players
        await tx.resultPlayer.deleteMany({
          where: { matchResultId: matchResult.id },
        });

        matchResult = await tx.matchResult.update({
          where: { id: matchResult.id },
          data: {
            publishedByAdminId: adminUserId,
            summary: summary || matchResult.summary,
            status: ResultStatus.DRAFT,
          },
        });
      } else {
        matchResult = await tx.matchResult.create({
          data: {
            matchId,
            publishedByAdminId: adminUserId,
            summary,
            status: ResultStatus.DRAFT,
          },
        });
      }

      // Create ResultPlayer records
      await tx.resultPlayer.createMany({
        data: calculatedPlayers.map((p) => ({
          matchResultId: matchResult!.id,
          userId: p.userId,
          joiningId: p.joiningId,
          inGameName: p.inGameName,
          rank: p.rank,
          kills: p.kills,
          prizeAmount: p.prizeAmount,
          killPrizeAmount: p.killPrizeAmount,
          totalPrizeAmount: p.totalPrizeAmount,
          isWinner: p.isWinner,
        })),
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          actorRole: 'ADMIN',
          action: 'RESULT_DRAFT_CREATED',
          entityType: 'MATCH_RESULT',
          entityId: matchResult.id,
          details: { matchId, playerCount: calculatedPlayers.length },
        },
      });

      return {
        matchResultId: matchResult.id,
        status: ResultStatus.DRAFT,
        players: calculatedPlayers,
      };
    });
  }

  /**
   * Atomically and idempotently publishes results and credits prize winnings.
   * Concurrency-safe: locks MatchResult and Wallets inside the transaction.
   */
  static async publishResult(params: PublishResultParams) {
    const { matchId, adminUserId, players, summary } = params;

    return await prisma.$transaction(async (tx) => {
      // 1. Concurrency lock on Match
      const [lockedMatch] = await tx.$queryRaw<Array<{ id: string; status: MatchStatus }>>`
        SELECT id, status FROM "Match" WHERE id = ${matchId} FOR UPDATE
      `;

      if (!lockedMatch) {
        throw new Error(`Match ${matchId} not found.`);
      }

      if (lockedMatch.status === MatchStatus.CANCELLED) {
        throw new Error(`Cannot publish results for CANCELLED match ${matchId}.`);
      }

      // 2. Lock or fetch MatchResult
      let matchResult = await tx.matchResult.findUnique({
        where: { matchId },
        include: { players: true },
      });

      // IDEMPOTENCY GUARD: If already PUBLISHED, return established settlement safely
      if (matchResult && matchResult.status === ResultStatus.PUBLISHED) {
        return {
          matchResultId: matchResult.id,
          status: ResultStatus.PUBLISHED,
          alreadyPublished: true,
          message: 'Match results are already officially published and settled.',
          players: matchResult.players,
        };
      }

      let resultId: string;
      let calculatedPlayers;

      if (players && players.length > 0) {
        const validated = await this.validateAndCalculateResults({
          matchId,
          players,
          tx,
        });
        calculatedPlayers = validated.calculatedPlayers;

        if (matchResult) {
          await tx.resultPlayer.deleteMany({
            where: { matchResultId: matchResult.id },
          });
          const updated = await tx.matchResult.update({
            where: { id: matchResult.id },
            data: {
              publishedByAdminId: adminUserId,
              summary: summary || matchResult.summary,
            },
          });
          resultId = updated.id;
        } else {
          const created = await tx.matchResult.create({
            data: {
              matchId,
              publishedByAdminId: adminUserId,
              summary,
              status: ResultStatus.DRAFT,
            },
          });
          resultId = created.id;
        }

        await tx.resultPlayer.createMany({
          data: calculatedPlayers.map((p) => ({
            matchResultId: resultId,
            userId: p.userId,
            joiningId: p.joiningId,
            inGameName: p.inGameName,
            rank: p.rank,
            kills: p.kills,
            prizeAmount: p.prizeAmount,
            killPrizeAmount: p.killPrizeAmount,
            totalPrizeAmount: p.totalPrizeAmount,
            isWinner: p.isWinner,
          })),
        });
      } else {
        if (!matchResult || matchResult.players.length === 0) {
          throw new Error(`No draft results found for match ${matchId} to publish.`);
        }
        resultId = matchResult.id;
        calculatedPlayers = matchResult.players.map((p) => ({
          userId: p.userId!,
          joiningId: p.joiningId!,
          inGameName: p.inGameName,
          rank: p.rank,
          kills: p.kills,
          prizeAmount: Number(p.prizeAmount),
          killPrizeAmount: Number(p.killPrizeAmount),
          totalPrizeAmount: Number(p.totalPrizeAmount),
          isWinner: p.isWinner,
        }));
      }

      const now = new Date();

      // 3. Mark MatchResult as PUBLISHED
      await tx.matchResult.update({
        where: { id: resultId },
        data: {
          status: ResultStatus.PUBLISHED,
          publishedAt: now,
          settledAt: now,
        },
      });

      // 4. Mark Match as RESULTED
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.RESULTED,
          resultPublishedAt: now,
        },
      });

      // 5. Atomic, Idempotent Prize Distribution via Wallet Ledger
      const matchDetails = await tx.match.findUnique({ where: { id: matchId } });
      const matchTitle = matchDetails?.title || 'Tournament';

      for (const player of calculatedPlayers) {
        if (player.totalPrizeAmount > 0 && player.userId) {
          const idempotencyKey = `${resultId}_${player.userId}_PRIZE_WIN`;

          await WalletService.creditPrize({
            tx,
            userId: player.userId,
            amount: player.totalPrizeAmount,
            referenceType: 'MATCH_RESULT',
            referenceId: resultId,
            idempotencyKey,
            description: `Prize for Rank #${player.rank} in ${matchTitle} (${player.kills} kills)`,
          });

          // Create notification for winner
          await tx.notification.create({
            data: {
              userId: player.userId,
              title: `🏆 Prize Credited: ₹${player.totalPrizeAmount}`,
              message: `Congratulations! You placed Rank #${player.rank} with ${player.kills} kills in ${matchTitle}. Your winnings have been credited to your wallet.`,
              type: 'RESULT',
              actionUrl: '/arena/wallet',
            },
          });
        }
      }

      // 6. Audit Logging
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          actorRole: 'ADMIN',
          action: 'RESULT_PUBLISHED',
          entityType: 'MATCH_RESULT',
          entityId: resultId,
          details: {
            matchId,
            publishedAt: now.toISOString(),
            playerCount: calculatedPlayers.length,
          },
        },
      });

      return {
        matchResultId: resultId,
        status: ResultStatus.PUBLISHED,
        publishedAt: now,
        players: calculatedPlayers,
      };
    });
  }

  /**
   * Administrative Compensating Correction.
   * Compares OLD settlements with NEW settlements, generating compensating ADJUSTMENT
   * ledger transactions without mutating past ledger records.
   */
  static async correctResult(params: CorrectResultParams) {
    const { matchId, adminUserId, reason, players, summary } = params;

    if (!reason || reason.trim().length < 5) {
      throw new Error('Administrative correction requires a detailed explanatory reason.');
    }

    return await prisma.$transaction(async (tx) => {
      const matchResult = await tx.matchResult.findUnique({
        where: { matchId },
        include: { players: true, match: true },
      });

      if (!matchResult) {
        throw new Error(`Match ${matchId} has no result record.`);
      }

      if (matchResult.status !== ResultStatus.PUBLISHED) {
        throw new Error(`Cannot correct a result that is not yet PUBLISHED. Edit the DRAFT instead.`);
      }

      // Old settlements map: userId -> totalPrizeAmount
      const oldSettlements = new Map<string, number>();
      for (const p of matchResult.players) {
        if (p.userId) {
          oldSettlements.set(p.userId, Number(p.totalPrizeAmount));
        }
      }

      // Validate new results
      const { calculatedPlayers } = await this.validateAndCalculateResults({
        matchId,
        players,
        tx,
      });

      // Update ResultPlayer records
      await tx.resultPlayer.deleteMany({
        where: { matchResultId: matchResult.id },
      });

      await tx.resultPlayer.createMany({
        data: calculatedPlayers.map((p) => ({
          matchResultId: matchResult.id,
          userId: p.userId,
          joiningId: p.joiningId,
          inGameName: p.inGameName,
          rank: p.rank,
          kills: p.kills,
          prizeAmount: p.prizeAmount,
          killPrizeAmount: p.killPrizeAmount,
          totalPrizeAmount: p.totalPrizeAmount,
          isWinner: p.isWinner,
        })),
      });

      if (summary) {
        await tx.matchResult.update({
          where: { id: matchResult.id },
          data: { summary },
        });
      }

      // New settlements map: userId -> totalPrizeAmount
      const newSettlements = new Map<string, number>();
      for (const p of calculatedPlayers) {
        newSettlements.set(p.userId, p.totalPrizeAmount);
      }

      // Union of all affected user IDs
      const allUserIds = new Set<string>();
      oldSettlements.forEach((_, uid) => allUserIds.add(uid));
      newSettlements.forEach((_, uid) => allUserIds.add(uid));
      const adjustments: Array<{ userId: string; delta: number }> = [];

      for (const uid of Array.from(allUserIds)) {
        const oldAmt = oldSettlements.get(uid) || 0;
        const newAmt = newSettlements.get(uid) || 0;
        const delta = Number((newAmt - oldAmt).toFixed(2));

        if (delta !== 0) {
          const correctionId = `ADJ_${matchResult.id}_${uid}_${Date.now()}`;
          await WalletService.applyAdjustment({
            tx,
            userId: uid,
            amountDelta: delta,
            referenceType: 'RESULT_CORRECTION',
            referenceId: matchResult.id,
            idempotencyKey: correctionId,
            description: `Correction: ${reason}`,
          });

          adjustments.push({ userId: uid, delta });

          await tx.notification.create({
            data: {
              userId: uid,
              title: 'Prize Correction Notice',
              message: `Official results for ${matchResult.match.title} were administratively corrected (${reason}). Your wallet was adjusted by ${delta > 0 ? '+' : ''}₹${delta.toFixed(2)}.`,
              type: 'RESULT',
              actionUrl: '/arena/wallet',
            },
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          actorRole: 'ADMIN',
          action: 'RESULT_CORRECTED',
          entityType: 'MATCH_RESULT',
          entityId: matchResult.id,
          details: {
            matchId,
            reason,
            adjustments,
          },
        },
      });

      return {
        matchResultId: matchResult.id,
        status: ResultStatus.PUBLISHED,
        corrected: true,
        adjustments,
        players: calculatedPlayers,
      };
    });
  }

  /**
   * Retrieves official match result.
   * Normal users can only see PUBLISHED results.
   * Admins can inspect DRAFT results.
   */
  static async getMatchResult(matchId: string, isAdmin: boolean = false) {
    const matchResult = await prisma.matchResult.findUnique({
      where: { matchId },
      include: {
        match: {
          select: {
            id: true,
            title: true,
            contestId: true,
            gameMode: true,
            map: true,
            prizeAmount: true,
            perKillPrize: true,
            status: true,
            matchDate: true,
          },
        },
        players: {
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!matchResult) {
      return null;
    }

    if (matchResult.status === ResultStatus.DRAFT && !isAdmin) {
      return null;
    }

    return {
      id: matchResult.id,
      matchId: matchResult.matchId,
      match: {
        ...matchResult.match,
        prizeAmount: Number(matchResult.match.prizeAmount),
        perKillPrize: matchResult.match.perKillPrize ? Number(matchResult.match.perKillPrize) : null,
      },
      status: matchResult.status,
      publishedAt: matchResult.publishedAt,
      summary: matchResult.summary,
      players: matchResult.players.map((p) => ({
        id: p.id,
        userId: p.userId,
        joiningId: p.joiningId,
        inGameName: p.inGameName,
        rank: p.rank,
        kills: p.kills,
        prizeAmount: Number(p.prizeAmount),
        killPrizeAmount: Number(p.killPrizeAmount),
        totalPrizeAmount: Number(p.totalPrizeAmount),
        isWinner: p.isWinner,
      })),
    };
  }
}
