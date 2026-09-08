import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { ResultService } from '@/lib/tournament/resultService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;

    // Optional admin check to allow admins to inspect DRAFT results
    let isAdmin = false;
    const { user } = await AuthMiddleware.authenticate(request);
    if (user && user.role === 'ADMIN') {
      isAdmin = true;
    }

    const result = await ResultService.getMatchResult(matchId, isAdmin);

    if (!result) {
      return Api.notFound('Official results have not been published for this match yet.');
    }

    return Api.success(result);
  } catch (error: any) {
    return Api.serverError('Failed to fetch match results', error.message);
  }
}
