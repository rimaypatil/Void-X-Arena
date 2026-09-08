import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const games = await prisma.game.findMany({
      where: { status: 'ACTIVE' },
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

    const formatted = games.map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      image: g.image,
      gameMode: g.gameMode,
      playerCount: g.playerCount,
      badge: g.badge,
      activeMatchesCount: g._count.matches,
    }));

    return Api.success(formatted);
  } catch (error: any) {
    return Api.serverError('Failed to fetch esports games', error.message);
  }
}
