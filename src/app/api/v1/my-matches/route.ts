import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { RoomCredentialsPolicy } from '@/lib/security/roomPolicy';

export async function GET(request: NextRequest) {
  try {
    const { user: authUser, errorResponse } = await AuthMiddleware.authenticate(request);
    if (errorResponse || !authUser) {
      return errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status'); // Optional: 'UPCOMING' | 'ONGOING' | 'RESULTED'

    // Fetch user's confirmed joinings
    const joinings = await prisma.joining.findMany({
      where: {
        userId: authUser.userId,
        status: 'CONFIRMED',
      },
      include: {
        slot: {
          select: {
            slotNumber: true,
            teamNumber: true,
            position: true,
          },
        },
        match: {
          include: {
            game: {
              select: {
                name: true,
                slug: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        match: { matchDate: 'asc' },
      },
    });

    const userRecord = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { status: true },
    });
    const userStanding = userRecord?.status || 'ACTIVE';

    // Map matches and dynamically check room credentials per match based on authoritative policy
    const matchesMapped = joinings.map((j) => {
      const match = j.match;
      const roomCheck = RoomCredentialsPolicy.checkEligibility({
        joiningStatus: 'CONFIRMED',
        userStatus: userStanding,
        matchStatus: match.status,
        matchStartTime: match.matchDate,
      });

      const sanitizedMatch = RoomCredentialsPolicy.sanitizeMatchPublic(match);

      return {
        joiningId: j.id,
        teamNumber: j.slot.teamNumber,
        slotNumber: j.slot.slotNumber,
        position: j.slot.position,
        inGameName: j.inGameName,
        inGameId: j.inGameId,
        match: {
          ...sanitizedMatch,
          entryFee: Number(match.entryFee),
          prizeAmount: Number(match.prizeAmount),
          perKillPrize: match.perKillPrize ? Number(match.perKillPrize) : null,
        },
        roomAccess: {
          isUnlocked: roomCheck.isEligible && Boolean(match.roomId && match.roomPassword),
          credentials:
            roomCheck.isEligible && match.roomId && match.roomPassword
              ? { roomId: match.roomId, roomPassword: match.roomPassword }
              : null,
          countdownSeconds: roomCheck.countdownSeconds,
          reason: roomCheck.reason,
        },
      };
    });

    // Categorize by dynamic match status
    const upcoming = matchesMapped.filter((m) => m.match.status === 'UPCOMING');
    const ongoing = matchesMapped.filter((m) => m.match.status === 'ONGOING');
    const resulted = matchesMapped.filter((m) => m.match.status === 'RESULTED');

    if (filterStatus === 'UPCOMING') {
      return Api.success({ matches: upcoming, count: upcoming.length });
    }
    if (filterStatus === 'ONGOING') {
      return Api.success({ matches: ongoing, count: ongoing.length });
    }
    if (filterStatus === 'RESULTED') {
      return Api.success({ matches: resulted, count: resulted.length });
    }

    return Api.success({
      totalConfirmed: matchesMapped.length,
      upcoming,
      ongoing,
      resulted,
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch My Matches', error.message);
  }
}
