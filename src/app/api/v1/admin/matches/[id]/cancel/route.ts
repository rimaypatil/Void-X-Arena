import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { MatchCancellationService } from '@/lib/tournament/matchCancellation';

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
    const reason = body?.reason?.trim() || 'Administrative fixture cancellation';

    const result = await MatchCancellationService.cancelMatchWithRefunds({
      matchId,
      adminUserId: adminUser.userId,
      reason,
    });

    return Api.success({
      message: `Match cancelled. ${result.totalJoiningsRefunded} joinings refunded.`,
      result,
    });
  } catch (error: any) {
    return Api.serverError('Match cancellation failed', error.message);
  }
}
