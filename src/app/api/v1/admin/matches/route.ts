import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminMatchService } from '@/lib/tournament/adminMatchService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const gameId = searchParams.get('gameId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await AdminMatchService.listMatches({
      status,
      gameId,
      search,
      page,
      limit,
    });

    return Api.success(result);
  } catch (error: any) {
    return Api.serverError('Failed to fetch matches', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body) {
      return Api.badRequest('Invalid request body. Expected JSON.');
    }

    // Required fields check
    const required = [
      'contestId',
      'title',
      'bannerImage',
      'gameId',
      'gameMode',
      'map',
      'matchDate',
      'matchTime',
      'registrationStart',
      'registrationEnd',
      'entryFee',
      'prizeAmount',
      'totalSlots',
    ];

    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return Api.badRequest(`Missing required field: ${field}`);
      }
    }

    const match = await AdminMatchService.createMatch(body, user.userId);
    return Api.created({
      message: 'Tournament match created and all slot records initialized.',
      match,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
