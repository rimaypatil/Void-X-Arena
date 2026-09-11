import { prisma } from '@/lib/db/prisma';
import { MatchStatus, SlotStatus, TeamType, Prisma } from '@prisma/client';
import { SlotService } from './slotService';
import { AdminAuditService } from '@/lib/audit/adminAudit';
import { MatchCancellationService } from './matchCancellation';

export interface CreateMatchInput {
  contestId: string;
  title: string;
  bannerImage: string;
  gameId: string;
  gameMode: string;
  teamType?: TeamType;
  matchType?: string;
  map: string;
  matchDate: Date | string;
  matchTime: string;
  registrationStart: Date | string;
  registrationEnd: Date | string;
  entryFee: number;
  prizeAmount: number;
  perKillPrize?: number | null;
  totalSlots: number;
  version?: string;
  prizeDistribution: any;
  rules?: Array<{ ruleText: string; displayOrder: number }>;
  roomId?: string | null;
  roomPassword?: string | null;
}

export interface UpdateMatchInput {
  title?: string;
  bannerImage?: string;
  gameId?: string;
  gameMode?: string;
  teamType?: TeamType;
  matchType?: string;
  map?: string;
  matchDate?: Date | string;
  matchTime?: string;
  registrationStart?: Date | string;
  registrationEnd?: Date | string;
  entryFee?: number;
  prizeAmount?: number;
  perKillPrize?: number | null;
  version?: string;
  prizeDistribution?: any;
  roomId?: string | null;
  roomPassword?: string | null;
}

export class AdminMatchService {
  /**
   * Retrieves paginated list of matches for the admin control plane with real slot & joining counts.
   */
  static async listMatches(params: {
    status?: string;
    gameId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { status, gameId, page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MatchWhereInput = {};
    if (status && status !== 'ALL') {
      where.status = status as MatchStatus;
    }
    if (gameId && gameId !== 'ALL') {
      where.gameId = gameId;
    }
    if (search && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { contestId: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: { matchDate: 'desc' },
        skip,
        take: limit,
        include: {
          game: { select: { id: true, name: true, image: true, badge: true } },
          _count: {
            select: {
              slots: true,
              joinings: { where: { status: 'CONFIRMED' } },
            },
          },
          result: { select: { id: true, status: true, publishedAt: true } },
        },
      }),
      prisma.match.count({ where }),
    ]);

    return {
      matches: matches.map((m) => ({
        id: m.id,
        contestId: m.contestId,
        title: m.title,
        bannerImage: m.bannerImage,
        gameMode: m.gameMode,
        teamType: m.teamType,
        map: m.map,
        status: m.status,
        matchDate: m.matchDate.toISOString(),
        matchTime: m.matchTime,
        entryFee: Number(m.entryFee),
        prizeAmount: Number(m.prizeAmount),
        perKillPrize: m.perKillPrize ? Number(m.perKillPrize) : null,
        totalSlots: m.totalSlots,
        filledSlots: m.filledSlots,
        confirmedPlayersCount: m._count.joinings,
        roomId: m.roomId,
        roomPassword: m.roomPassword,
        game: m.game,
        result: m.result,
        createdAt: m.createdAt.toISOString(),
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
   * Retrieves complete match detail including slots, participants, rules, and result summary.
   */
  static async getMatchDetail(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        game: true,
        rules: { orderBy: { displayOrder: 'asc' } },
        slots: {
          orderBy: { slotNumber: 'asc' },
          include: {
            reservedByUser: {
              select: { id: true, username: true, gameName: true, gameUid: true },
            },
          },
        },
        joinings: {
          orderBy: { teamNumber: 'asc' },
          include: {
            user: { select: { id: true, username: true, email: true, phone: true } },
            payments: { select: { id: true, orderId: true, amount: true, status: true, createdAt: true } },
          },
        },
        result: {
          include: {
            players: { orderBy: { rank: 'asc' } },
          },
        },
      },
    });

    if (!match) {
      throw new Error(`Match with ID ${matchId} not found.`);
    }

    const slotMetrics = await SlotService.getAuthoritativeSlotMetrics(matchId);

    return {
      ...match,
      entryFee: Number(match.entryFee),
      prizeAmount: Number(match.prizeAmount),
      perKillPrize: match.perKillPrize ? Number(match.perKillPrize) : null,
      slotMetrics,
    };
  }

  /**
   * Authoritatively creates a new tournament match and auto-initializes all slot records.
   */
  static async createMatch(data: CreateMatchInput, adminUserId: string) {
    // Validate uniqueness of contestId
    const existing = await prisma.match.findUnique({
      where: { contestId: data.contestId },
    });
    if (existing) {
      throw new Error(`Contest ID "${data.contestId}" already exists. Must be unique.`);
    }

    // Verify game exists
    const game = await prisma.game.findUnique({ where: { id: data.gameId } });
    if (!game) {
      throw new Error(`Esports Game ID "${data.gameId}" not found.`);
    }

    // Determine team size for slot generation (Squad = 4, Duo = 2, Solo = 1)
    const teamSize = data.teamType === 'SQUAD' ? 4 : data.teamType === 'DUO' ? 2 : 1;

    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          contestId: data.contestId,
          title: data.title,
          bannerImage: data.bannerImage,
          gameId: data.gameId,
          gameMode: data.gameMode,
          teamType: data.teamType || TeamType.SOLO,
          matchType: data.matchType || 'CLASSIC_CUSTOM',
          map: data.map,
          status: MatchStatus.DRAFT,
          matchDate: new Date(data.matchDate),
          matchTime: data.matchTime,
          registrationStart: new Date(data.registrationStart),
          registrationEnd: new Date(data.registrationEnd),
          entryFee: data.entryFee,
          prizeAmount: data.prizeAmount,
          perKillPrize: data.perKillPrize ?? null,
          totalSlots: data.totalSlots,
          version: data.version || 'Mobile Only',
          prizeDistribution: data.prizeDistribution || [],
          roomId: data.roomId || null,
          roomPassword: data.roomPassword || null,
          rules: data.rules && data.rules.length > 0
            ? {
                create: data.rules.map((r, idx) => ({
                  ruleText: r.ruleText,
                  displayOrder: r.displayOrder ?? idx + 1,
                  isActive: true,
                })),
              }
            : undefined,
        },
      });

      // Initialize all slot records
      const slotsData = [];
      for (let s = 1; s <= data.totalSlots; s++) {
        const teamNumber = Math.ceil(s / teamSize);
        const position = ((s - 1) % teamSize) + 1;
        slotsData.push({
          matchId: created.id,
          slotNumber: s,
          teamNumber,
          position,
          status: SlotStatus.AVAILABLE,
        });
      }

      await tx.slot.createMany({
        data: slotsData,
      });

      return created;
    });

    await AdminAuditService.record({
      action: 'MATCH_CREATED',
      actorId: adminUserId,
      entityType: 'MATCH',
      entityId: match.id,
      details: {
        contestId: match.contestId,
        title: match.title,
        totalSlots: match.totalSlots,
        prizeAmount: Number(match.prizeAmount),
      },
    });

    return match;
  }

  /**
   * Updates match details.
   */
  static async updateMatch(matchId: string, data: UpdateMatchInput, adminUserId: string) {
    const existing = await prisma.match.findUnique({ where: { id: matchId } });
    if (!existing) {
      throw new Error(`Match ${matchId} not found.`);
    }

    if (existing.status === MatchStatus.RESULTED || existing.status === MatchStatus.CANCELLED) {
      throw new Error(`Cannot update a ${existing.status} match.`);
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        title: data.title,
        bannerImage: data.bannerImage,
        gameId: data.gameId,
        gameMode: data.gameMode,
        teamType: data.teamType,
        matchType: data.matchType,
        map: data.map,
        matchDate: data.matchDate ? new Date(data.matchDate) : undefined,
        matchTime: data.matchTime,
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : undefined,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : undefined,
        entryFee: data.entryFee !== undefined ? data.entryFee : undefined,
        prizeAmount: data.prizeAmount !== undefined ? data.prizeAmount : undefined,
        perKillPrize: data.perKillPrize !== undefined ? data.perKillPrize : undefined,
        version: data.version,
        prizeDistribution: data.prizeDistribution !== undefined ? data.prizeDistribution : undefined,
        roomId: data.roomId !== undefined ? data.roomId : undefined,
        roomPassword: data.roomPassword !== undefined ? data.roomPassword : undefined,
      },
    });

    await AdminAuditService.record({
      action: 'MATCH_UPDATED',
      actorId: adminUserId,
      entityType: 'MATCH',
      entityId: matchId,
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  /**
   * State machine transitions with strict idempotency and audit logs.
   */
  static async transitionStatus(params: {
    matchId: string;
    newStatus: MatchStatus;
    adminUserId: string;
    reason?: string;
    roomId?: string;
    roomPassword?: string;
  }) {
    const { matchId, newStatus, adminUserId, reason, roomId, roomPassword } = params;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new Error(`Match ${matchId} not found.`);
    }

    // IDEMPOTENCY GUARD: If already in newStatus, return safely
    if (match.status === newStatus) {
      return { match, alreadyInStatus: true };
    }

    // Handle CANCELLED transition via authoritative cancellation service (with refunds)
    if (newStatus === MatchStatus.CANCELLED) {
      const cancelResult = await MatchCancellationService.cancelMatchWithRefunds({
        matchId,
        adminUserId,
        reason: reason || 'Cancelled by administrator',
      });
      await AdminAuditService.record({
        action: 'MATCH_CANCELLED',
        actorId: adminUserId,
        entityType: 'MATCH',
        entityId: matchId,
        details: { cancelResult, reason },
      });
      const cancelledMatch = await prisma.match.findUnique({ where: { id: matchId } });
      return { match: cancelledMatch, cancelResult };
    }

    // Handle status transitions
    const updateData: Prisma.MatchUpdateInput = { status: newStatus };

    if (newStatus === MatchStatus.ONGOING) {
      if (roomId) updateData.roomId = roomId;
      if (roomPassword) updateData.roomPassword = roomPassword;
      if (roomId || roomPassword) {
        updateData.roomCredentialsPublishedAt = new Date();
      }
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });

    let actionEvent: any = 'MATCH_UPDATED';
    if (newStatus === MatchStatus.UPCOMING && match.status === MatchStatus.DRAFT) actionEvent = 'MATCH_PUBLISHED';
    else if (newStatus === MatchStatus.DRAFT && match.status === MatchStatus.UPCOMING) actionEvent = 'MATCH_UNPUBLISHED';
    else if (newStatus === MatchStatus.ONGOING) actionEvent = 'MATCH_STARTED';
    else if (newStatus === MatchStatus.SUSPENDED) actionEvent = 'MATCH_SUSPENDED';

    await AdminAuditService.record({
      action: actionEvent,
      actorId: adminUserId,
      entityType: 'MATCH',
      entityId: matchId,
      details: {
        from: match.status,
        to: newStatus,
        reason,
      },
    });

    return { match: updated, alreadyInStatus: false };
  }

  /**
   * Room ID & Password publisher with automated timestamping and audit trail.
   */
  static async updateRoomCredentials(params: {
    matchId: string;
    roomId: string;
    roomPassword: string;
    adminUserId: string;
  }) {
    const { matchId, roomId, roomPassword, adminUserId } = params;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new Error(`Match ${matchId} not found.`);
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        roomId,
        roomPassword,
        roomCredentialsPublishedAt: new Date(),
      },
    });

    await AdminAuditService.record({
      action: 'ROOM_CREDENTIALS_UPDATED',
      actorId: adminUserId,
      entityType: 'MATCH',
      entityId: matchId,
      details: {
        roomId,
        publishedAt: new Date().toISOString(),
      },
    });

    return updated;
  }
}
