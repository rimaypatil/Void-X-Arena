import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { LeaderboardService } from '@/lib/tournament/leaderboardService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = (searchParams.get('sortBy') || 'earnings') as 'earnings' | 'kills' | 'wins';

    const leaderboard = await LeaderboardService.getLeaderboard({
      limit: isNaN(limit) ? 50 : Math.min(limit, 100),
      offset: isNaN(offset) ? 0 : offset,
      sortBy: ['earnings', 'kills', 'wins'].includes(sortBy) ? sortBy : 'earnings',
    });

    return Api.success(leaderboard);
  } catch (error: any) {
    return Api.serverError('Failed to fetch leaderboard', error.message);
  }
}
