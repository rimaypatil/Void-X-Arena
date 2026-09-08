import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { LeaderboardService } from '@/lib/tournament/leaderboardService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.authenticate(request);
    if (errorResponse || !user) {
      return errorResponse;
    }

    const statistics = await LeaderboardService.getUserStatistics(user.userId);
    return Api.success(statistics);
  } catch (error: any) {
    return Api.serverError('Failed to fetch user statistics', error.message);
  }
}
