import { prisma } from '@/lib/db/prisma';
import { GameStatus } from '@prisma/client';
import { AdminAuditService } from '@/lib/audit/adminAudit';

export interface CreateGameInput {
  name: string;
  slug: string;
  image: string;
  gameMode: string;
  playerCount: number;
  badge?: string | null;
  displayOrder?: number;
  status?: GameStatus;
  metadata?: any;
}

export interface UpdateGameInput {
  name?: string;
  slug?: string;
  image?: string;
  gameMode?: string;
  playerCount?: number;
  badge?: string | null;
  displayOrder?: number;
  status?: GameStatus;
  metadata?: any;
}

export class AdminGameService {
  /**
   * Retrieves all games including inactive ones with active matches metrics.
   */
  static async listGames() {
    const games = await prisma.game.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            matches: {
              where: {
                status: { in: ['UPCOMING', 'ONGOING'] },
              },
            },
          },
        },
      },
    });

    return games.map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      image: g.image,
      gameMode: g.gameMode,
      playerCount: g.playerCount,
      badge: g.badge,
      status: g.status,
      displayOrder: g.displayOrder,
      metadata: g.metadata,
      activeMatchesCount: g._count.matches,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }));
  }

  /**
   * Creates a new esports game entry.
   */
  static async createGame(data: CreateGameInput, adminUserId: string) {
    const existingSlug = await prisma.game.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new Error(`Game with slug "${data.slug}" already exists.`);
    }

    const game = await prisma.game.create({
      data: {
        name: data.name,
        slug: data.slug,
        image: data.image,
        gameMode: data.gameMode,
        playerCount: data.playerCount,
        badge: data.badge || null,
        displayOrder: data.displayOrder ?? 0,
        status: data.status || GameStatus.ACTIVE,
        metadata: data.metadata || null,
      },
    });

    await AdminAuditService.record({
      action: 'GAME_CREATED',
      actorId: adminUserId,
      entityType: 'GAME',
      entityId: game.id,
      details: { slug: game.slug, name: game.name },
    });

    return game;
  }

  /**
   * Updates an esports game card (image, order, badge, status).
   */
  static async updateGame(id: string, data: UpdateGameInput, adminUserId: string) {
    const existing = await prisma.game.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Game with ID "${id}" not found.`);
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.game.findUnique({ where: { slug: data.slug } });
      if (slugConflict) {
        throw new Error(`Game slug "${data.slug}" is already in use.`);
      }
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        image: data.image,
        gameMode: data.gameMode,
        playerCount: data.playerCount,
        badge: data.badge !== undefined ? data.badge : undefined,
        displayOrder: data.displayOrder !== undefined ? data.displayOrder : undefined,
        status: data.status !== undefined ? data.status : undefined,
        metadata: data.metadata !== undefined ? data.metadata : undefined,
      },
    });

    await AdminAuditService.record({
      action: 'GAME_UPDATED',
      actorId: adminUserId,
      entityType: 'GAME',
      entityId: id,
      details: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  /**
   * Deletes a game if no matches are associated with it.
   */
  static async deleteGame(id: string, adminUserId: string) {
    const matchCount = await prisma.match.count({ where: { gameId: id } });
    if (matchCount > 0) {
      throw new Error(`Cannot delete game with ID "${id}". It has ${matchCount} associated tournament matches. Deactivate it instead.`);
    }

    const deleted = await prisma.game.delete({ where: { id } });

    await AdminAuditService.record({
      action: 'GAME_DELETED',
      actorId: adminUserId,
      entityType: 'GAME',
      entityId: id,
      details: { slug: deleted.slug, name: deleted.name },
    });

    return deleted;
  }
}
