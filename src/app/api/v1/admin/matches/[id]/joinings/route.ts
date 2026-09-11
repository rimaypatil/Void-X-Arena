import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { JoiningStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'CONFIRMED'; // By default, only show successfully confirmed participants

    const where: any = { matchId: params.id };
    if (status !== 'ALL') {
      where.status = status as JoiningStatus;
    }

    const joinings = await prisma.joining.findMany({
      where,
      orderBy: [{ teamNumber: 'asc' }, { slot: { position: 'asc' } }],
      include: {
        user: {
          select: { id: true, username: true, email: true, phone: true, gameUid: true, gameName: true },
        },
        slot: {
          select: { slotNumber: true, teamNumber: true, position: true, status: true },
        },
        payments: {
          select: { id: true, orderId: true, amount: true, status: true, gatewayName: true, createdAt: true },
        },
      },
    });

    return Api.success({
      count: joinings.length,
      statusFilter: status,
      joinings: joinings.map((j) => ({
        id: j.id,
        teamNumber: j.teamNumber,
        slotNumber: j.slot.slotNumber,
        position: j.slot.position,
        slotStatus: j.slot.status,
        inGameName: j.inGameName,
        inGameId: j.inGameId,
        joiningStatus: j.status,
        amountPaid: Number(j.amountPaid),
        user: j.user,
        latestPayment: j.payments[0] || null,
        createdAt: j.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch match joinings', error.message);
  }
}
