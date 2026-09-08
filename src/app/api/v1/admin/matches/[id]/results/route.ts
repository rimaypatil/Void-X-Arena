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

    if (!body || !Array.isArray(body.players)) {
      return Api.badRequest('Invalid payload. "players" array is required.');
    }

    const draft = await ResultService.saveDraft({
      matchId,
      adminUserId: adminUser.userId,
      players: body.players,
      summary: body.summary,
    });

    return Api.success({
      message: 'Result draft saved successfully. No wallet balances or leaderboard changed.',
      draft,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
