import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { ErrorCodes } from '@/lib/api/errors';
import { prisma } from '@/lib/db/prisma';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { SlotService } from '@/lib/tournament/slotService';
import { Money } from '@/lib/utils/money';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: authUser, errorResponse } = await AuthMiddleware.authenticate(request);
    if (errorResponse || !authUser) {
      return errorResponse;
    }

    const matchId = params.id;
    const body = await request.json().catch(() => null);
    const slotNumber = body?.slotNumber ? parseInt(body.slotNumber, 10) : NaN;
    const inGameName = body?.inGameName?.trim();
    const inGameId = body?.inGameId?.trim();

    if (isNaN(slotNumber) || slotNumber <= 0) {
      return Api.validationError('Valid slotNumber is required.');
    }

    // Check user account standing
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { status: true, gameUid: true, gameName: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      return Api.forbidden('Your account is not eligible to reserve slots.', ErrorCodes.ACCOUNT_SUSPENDED);
    }

    const playerIGN = inGameName || user.gameName || authUser.username;
    const playerUID = inGameId || user.gameUid || '749201844';

    // Verify match status and registration window
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return Api.notFound('Tournament match not found.', ErrorCodes.MATCH_NOT_FOUND);
    }

    if (match.status !== 'UPCOMING') {
      return Api.error(
        ErrorCodes.REGISTRATION_CLOSED,
        `Registration is closed. Match is currently ${match.status.toLowerCase()}.`,
        undefined,
        400
      );
    }

    const now = new Date();
    if (match.registrationEnd && match.registrationEnd < now) {
      return Api.error(ErrorCodes.REGISTRATION_CLOSED, 'Registration deadline has passed for this fixture.', undefined, 400);
    }

    // Atomic slot reservation
    const entryFeePaise = Money.toPaise(Number(match.entryFee));
    const result = await SlotService.reserveSlotAtomic({
      matchId,
      slotNumber,
      userId: authUser.userId,
      inGameName: playerIGN,
      inGameId: playerUID,
      entryFeePaise,
    });

    if (!result.success) {
      if (result.error === 'SLOT_UNAVAILABLE') {
        return Api.error(
          ErrorCodes.SLOT_UNAVAILABLE,
          'This slot is no longer available. Please select another slot.',
          undefined,
          409
        );
      }
      return Api.error(ErrorCodes.DUPLICATE_JOINING, result.error || 'Failed to reserve slot.', undefined, 400);
    }

    return Api.success({
      slot: {
        id: result.slot.id,
        slotNumber: result.slot.slotNumber,
        teamNumber: result.slot.teamNumber,
        position: result.slot.position,
        status: result.slot.status,
        reservationExpiresAt: result.slot.reservationExpiresAt,
      },
      joining: {
        id: result.joining.id,
        status: result.joining.status,
        inGameName: result.joining.inGameName,
        inGameId: result.joining.inGameId,
        amountDue: Number(match.entryFee),
      },
    });
  } catch (error: any) {
    return Api.serverError('Slot reservation error', error.message);
  }
}
