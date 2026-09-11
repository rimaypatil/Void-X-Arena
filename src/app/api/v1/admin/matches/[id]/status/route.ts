import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminMatchService } from '@/lib/tournament/adminMatchService';
import { MatchStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || !body.status) {
      return Api.badRequest('Field "status" (MatchStatus) is required.');
    }

    const newStatus = body.status as MatchStatus;
    const allowed = Object.values(MatchStatus);
    if (!allowed.includes(newStatus)) {
      return Api.badRequest(`Invalid match status. Allowed: ${allowed.join(', ')}`);
    }

    const result = await AdminMatchService.transitionStatus({
      matchId: params.id,
      newStatus,
      adminUserId: user.userId,
      reason: body.reason,
      roomId: body.roomId,
      roomPassword: body.roomPassword,
    });

    return Api.success({
      message: result.alreadyInStatus
        ? `Match was already ${newStatus}. Idempotent transition verified.`
        : `Match status transitioned to ${newStatus}.`,
      result,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
