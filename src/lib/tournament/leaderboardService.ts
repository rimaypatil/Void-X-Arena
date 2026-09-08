import { prisma } from '@/lib/db/prisma';
import { ResultStatus, JoiningStatus } from '@prisma/client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  inGameName: string;
  matchesPlayed: number;
  wins: number;
  totalKills: number;
  totalEarnings: number;
  winRate: number; // percentage
}

export interface UserStatisticsSummary {
  userId: string;
  username: string;
  gameUid?: string | null;
  gameName?: string | null;
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  totalEarnings: number;
  winRate: number;
  podiums: number; // Top 3 finishes
}

export class LeaderboardService {
  /**
   * Authoritative global tournament leaderboard.
   * Dynamically aggregates strictly from published ResultPlayer records.
   */
  static async getLeaderboard(params: {
    limit?: number;
    offset?: number;
    sortBy?: 'earnings' | 'kills' | 'wins';
  } = {}): Promise<{
    entries: LeaderboardEntry[];
    totalContenders: number;
  }> {
    const { limit = 50, offset = 0, sortBy = 'earnings' } = params;

    // Fetch all published result players
    const resultPlayers = await prisma.resultPlayer.findMany({
      where: {
        matchResult: {
          status: ResultStatus.PUBLISHED,
        },
        userId: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            gameName: true,
          },
        },
      },
    });

    // Group by userId
    const statsByUser = new Map<
      string,
      {
        userId: string;
        username: string;
        inGameName: string;
        matchesPlayed: number;
        wins: number;
        totalKills: number;
        totalEarnings: number;
      }
    >();

    for (const rp of resultPlayers) {
      if (!rp.userId) continue;

      const existing = statsByUser.get(rp.userId) || {
        userId: rp.userId,
        username: rp.user?.username || 'Contender',
        inGameName: rp.inGameName || rp.user?.gameName || 'Contender',
        matchesPlayed: 0,
        wins: 0,
        totalKills: 0,
        totalEarnings: 0,
      };

      existing.matchesPlayed += 1;
      if (rp.isWinner || rp.rank === 1) {
        existing.wins += 1;
      }
      existing.totalKills += rp.kills;
      existing.totalEarnings = Number((existing.totalEarnings + Number(rp.totalPrizeAmount)).toFixed(2));

      statsByUser.set(rp.userId, existing);
    }

    // Convert to sorted array
    let sortedList = Array.from(statsByUser.values()).map((user) => {
      const winRate = user.matchesPlayed > 0
        ? Number(((user.wins / user.matchesPlayed) * 100).toFixed(1))
        : 0;
      return {
        ...user,
        winRate,
      };
    });

    if (sortBy === 'kills') {
      sortedList.sort((a, b) => b.totalKills - a.totalKills || b.totalEarnings - a.totalEarnings);
    } else if (sortBy === 'wins') {
      sortedList.sort((a, b) => b.wins - a.wins || b.totalEarnings - a.totalEarnings);
    } else {
      // Default: earnings
      sortedList.sort((a, b) => b.totalEarnings - a.totalEarnings || b.wins - a.wins || b.totalKills - a.totalKills);
    }

    const totalContenders = sortedList.length;
    const paginated = sortedList.slice(offset, offset + limit);

    const entries: LeaderboardEntry[] = paginated.map((item, idx) => ({
      rank: offset + idx + 1,
      userId: item.userId,
      username: item.username,
      inGameName: item.inGameName,
      matchesPlayed: item.matchesPlayed,
      wins: item.wins,
      totalKills: item.totalKills,
      totalEarnings: item.totalEarnings,
      winRate: item.winRate,
    }));

    return {
      entries,
      totalContenders,
    };
  }

  /**
   * Authoritative user statistics.
   * Strictly converges with the leaderboard by aggregating the same published ResultPlayer data.
   */
  static async getUserStatistics(userId: string): Promise<UserStatisticsSummary> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        gameUid: true,
        gameName: true,
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    // Total confirmed matches joined
    const confirmedJoiningsCount = await prisma.joining.count({
      where: {
        userId,
        status: JoiningStatus.CONFIRMED,
      },
    });

    // Published results for this user
    const publishedResults = await prisma.resultPlayer.findMany({
      where: {
        userId,
        matchResult: {
          status: ResultStatus.PUBLISHED,
        },
      },
    });

    let totalWins = 0;
    let totalKills = 0;
    let totalEarnings = 0;
    let podiums = 0;

    for (const rp of publishedResults) {
      if (rp.isWinner || rp.rank === 1) {
        totalWins += 1;
      }
      if (rp.rank <= 3) {
        podiums += 1;
      }
      totalKills += rp.kills;
      totalEarnings = Number((totalEarnings + Number(rp.totalPrizeAmount)).toFixed(2));
    }

    const totalMatches = Math.max(confirmedJoiningsCount, publishedResults.length);
    const winRate = totalMatches > 0
      ? Number(((totalWins / totalMatches) * 100).toFixed(1))
      : 0;

    return {
      userId: user.id,
      username: user.username,
      gameUid: user.gameUid,
      gameName: user.gameName,
      totalMatches,
      totalWins,
      totalKills,
      totalEarnings,
      winRate,
      podiums,
    };
  }
}
