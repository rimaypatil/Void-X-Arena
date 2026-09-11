import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminGameService } from '@/lib/tournament/adminGameService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const games = await AdminGameService.listGames();
    return Api.success(games);
  } catch (error: any) {
    return Api.serverError('Failed to fetch admin games', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.slug || !body.image || !body.gameMode || !body.playerCount) {
      return Api.badRequest('Required fields: name, slug, image, gameMode, playerCount.');
    }

    const game = await AdminGameService.createGame(body, user.userId);
    return Api.created({ message: 'Esports game created successfully.', game });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
