import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminMatchService } from '@/lib/tournament/adminMatchService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const match = await AdminMatchService.getMatchDetail(params.id);
    return Api.success(match);
  } catch (error: any) {
    return Api.notFound(error.message);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body) return Api.badRequest('Invalid JSON payload.');

    const updated = await AdminMatchService.updateMatch(params.id, body, user.userId);
    return Api.success({
      message: 'Match updated successfully.',
      match: updated,
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
