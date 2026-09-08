import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    const joinings = await prisma.joining.findMany({
      where: {
        matchId,
        status: 'CONFIRMED', // Authoritative: strictly confirmed players only
      },
      include: {
        slot: {
          select: {
            slotNumber: true,
            teamNumber: true,
            position: true,
          },
        },
      },
      orderBy: [
        { teamNumber: 'asc' },
        { slot: { position: 'asc' } },
      ],
    });

    const participants = joinings.map((j) => ({
      id: j.id,
      slotNumber: j.slot.slotNumber,
      teamNumber: j.slot.teamNumber,
      position: j.slot.position,
      inGameName: j.inGameName,
      inGameId: j.inGameId,
      joinedAt: j.createdAt,
    }));

    return Api.success({
      matchId,
      confirmedCount: participants.length,
      participants,
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch match joinings', error.message);
  }
}
