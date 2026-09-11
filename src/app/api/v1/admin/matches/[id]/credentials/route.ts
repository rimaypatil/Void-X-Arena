import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminMatchService } from '@/lib/tournament/adminMatchService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || !body.roomId || !body.roomPassword) {
      return Api.badRequest('Both "roomId" and "roomPassword" are required.');
    }

    const updated = await AdminMatchService.updateRoomCredentials({
      matchId: params.id,
      roomId: String(body.roomId).trim(),
      roomPassword: String(body.roomPassword).trim(),
      adminUserId: user.userId,
    });

    return Api.success({
      message: 'Room credentials updated and published timestamp recorded.',
      match: {
        id: updated.id,
        roomId: updated.roomId,
        roomCredentialsPublishedAt: updated.roomCredentialsPublishedAt,
      },
    });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
