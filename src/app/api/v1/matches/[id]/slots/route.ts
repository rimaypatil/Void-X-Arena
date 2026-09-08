import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { SlotService } from '@/lib/tournament/slotService';
import { AuthMiddleware } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    // Clean up any expired reservations first
    await SlotService.cleanupExpiredReservations(matchId);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        title: true,
        teamType: true,
        totalSlots: true,
        status: true,
      },
    });

    if (!match) {
      return Api.notFound('Match fixture not found.');
    }

    // Ensure slot records exist in database
    await SlotService.initializeSlotsForMatch(
      matchId,
      match.totalSlots,
      match.teamType === 'SOLO' ? 1 : match.teamType === 'DUO' ? 2 : 4
    );

    // Fetch all slot records
    const slots = await prisma.slot.findMany({
      where: { matchId },
      orderBy: { slotNumber: 'asc' },
      select: {
        id: true,
        slotNumber: true,
        teamNumber: true,
        position: true,
        status: true,
        reservedByUserId: true,
        reservationExpiresAt: true,
      },
    });

    // Check if current authenticated user has an active slot
    const { user: authUser } = await AuthMiddleware.authenticate(request);

    const now = new Date();
    const formattedSlots = slots.map((s) => {
      const isMine = authUser ? s.reservedByUserId === authUser.userId : false;
      const isExpired = s.reservationExpiresAt && s.reservationExpiresAt < now;
      const displayStatus = isExpired ? 'AVAILABLE' : s.status;

      return {
        id: s.id,
        slotNumber: s.slotNumber,
        teamNumber: s.teamNumber,
        position: s.position,
        status: displayStatus,
        isMine,
      };
    });

    const metrics = await SlotService.getAuthoritativeSlotMetrics(matchId);

    return Api.success({
      matchId,
      metrics,
      slots: formattedSlots,
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch match slot grid', error.message);
  }
}
