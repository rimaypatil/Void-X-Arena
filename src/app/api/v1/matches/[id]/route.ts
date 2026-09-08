import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { ErrorCodes } from '@/lib/api/errors';
import { prisma } from '@/lib/db/prisma';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { RoomCredentialsPolicy } from '@/lib/security/roomPolicy';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        game: true,
        rules: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            slots: true,
            joinings: { where: { status: 'CONFIRMED' } },
          },
        },
      },
    });

    if (!match) {
      return Api.notFound('Match fixture not found.', ErrorCodes.MATCH_NOT_FOUND);
    }

    // Default sanitized response: credentials hidden
    let userHasConfirmedJoining = false;
    let userStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED' = 'ACTIVE';
    let roomCredentials: { roomId: string; roomPassword: string } | null = null;
    let roomEligibilityResult: ReturnType<typeof RoomCredentialsPolicy.checkEligibility> = {
      isEligible: false,
      code: 'PUBLIC_OR_UNAUTHENTICATED',
      reason: 'Please sign in with a confirmed slot to view room credentials.',
      countdownSeconds: undefined,
    };

    // Check authenticated user
    const { user: authUser } = await AuthMiddleware.authenticate(request);
    if (authUser) {
      const userRecord = await prisma.user.findUnique({
        where: { id: authUser.userId },
        include: {
          joinings: {
            where: {
              matchId: match.id,
              status: 'CONFIRMED',
            },
          },
        },
      });

      if (userRecord) {
        userStatus = userRecord.status;
        userHasConfirmedJoining = userRecord.joinings.length > 0;

        roomEligibilityResult = RoomCredentialsPolicy.checkEligibility({
          joiningStatus: userHasConfirmedJoining ? 'CONFIRMED' : null,
          userStatus,
          matchStartTime: match.matchDate,
          matchStatus: match.status,
        });

        // ONLY disclose credentials if hard backend policy passes
        if (roomEligibilityResult.isEligible && match.roomId && match.roomPassword) {
          roomCredentials = {
            roomId: match.roomId,
            roomPassword: match.roomPassword,
          };
        }
      }
    }

    const sanitizedMatch = RoomCredentialsPolicy.sanitizeMatchPublic(match);

    return Api.success({
      match: {
        ...sanitizedMatch,
        entryFee: Number(match.entryFee),
        prizeAmount: Number(match.prizeAmount),
        perKillPrize: match.perKillPrize ? Number(match.perKillPrize) : null,
      },
      roomAccess: {
        isUnlocked: Boolean(roomCredentials),
        credentials: roomCredentials,
        eligibility: roomEligibilityResult,
        userHasConfirmedJoining,
      },
    });
  } catch (error: any) {
    return Api.serverError('Failed to fetch match details', error.message);
  }
}
