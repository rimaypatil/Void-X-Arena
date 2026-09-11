import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { SlotService } from '@/lib/tournament/slotService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const [metrics, slots] = await Promise.all([
      SlotService.getAuthoritativeSlotMetrics(params.id),
      prisma.slot.findMany({
        where: { matchId: params.id },
        orderBy: { slotNumber: 'asc' },
        include: {
          reservedByUser: {
            select: { id: true, username: true, gameName: true, gameUid: true },
          },
        },
      }),
    ]);

    return Api.success({
      metrics,
      slots,
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch slot breakdown', error.message);
  }
}
