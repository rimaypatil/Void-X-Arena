import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { ResultService } from '@/lib/tournament/resultService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user: adminUser, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !adminUser) {
      return errorResponse;
    }

    const matchId = params.id;
    const body = await request.json().catch(() => null);

    if (!body || !body.reason || !Array.isArray(body.players)) {
      return Api.badRequest('Invalid payload. "reason" (string) and "players" (array) are required.');
    }

    const correction = await ResultService.correctResult({
      matchId,
      adminUserId: adminUser.userId,
      reason: body.reason,
      players: body.players,
      summary: body.summary,
    });

    return Api.success({
      message: 'Match results administratively corrected. Compensating ADJUSTMENT ledger transactions recorded.',
      correction,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
