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

    const result = await ResultService.publishResult({
      matchId,
      adminUserId: adminUser.userId,
      players: body?.players, // Optional: if provided, validates and publishes directly
      summary: body?.summary,
    });

    return Api.success({
      message: result.alreadyPublished
        ? 'Results were already published. Returned idempotent response.'
        : 'Official results published, match status marked RESULTED, and prizes settled to wallets.',
      result,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
