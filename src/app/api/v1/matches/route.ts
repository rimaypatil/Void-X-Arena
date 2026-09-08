import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { RoomCredentialsPolicy } from '@/lib/security/roomPolicy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const gameMode = searchParams.get('gameMode');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (gameMode) {
      where.gameMode = gameMode;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            badge: true,
          },
        },
        rules: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            ruleText: true,
            displayOrder: true,
          },
        },
        _count: {
          select: {
            slots: true,
            joinings: { where: { status: 'CONFIRMED' } },
          },
        },
        result: {
          select: {
            id: true,
            status: true,
            publishedAt: true,
            summary: true,
            players: {
              orderBy: { rank: 'asc' },
              select: {
                id: true,
                rank: true,
                inGameName: true,
                kills: true,
                prizeAmount: true,
                killPrizeAmount: true,
                totalPrizeAmount: true,
                isWinner: true,
              },
            },
          },
        },
      },
      orderBy: { matchDate: 'desc' },
    });

    // Hard authoritative security policy: Public match listings NEVER contain room credentials
    const sanitizedMatches = matches.map((m) => {
      const sanitized = RoomCredentialsPolicy.sanitizeMatchPublic(m);
      return {
        ...sanitized,
        entryFee: Number(m.entryFee),
        prizeAmount: Number(m.prizeAmount),
        perKillPrize: m.perKillPrize ? Number(m.perKillPrize) : null,
      };
    });

    return Api.success(sanitizedMatches);
  } catch (error: any) {
    return Api.serverError('Failed to fetch matches', error.message);
  }
}
