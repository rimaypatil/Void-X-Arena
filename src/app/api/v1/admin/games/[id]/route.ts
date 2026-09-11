import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminGameService } from '@/lib/tournament/adminGameService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body) return Api.badRequest('Invalid payload.');

    const updated = await AdminGameService.updateGame(params.id, body, user.userId);
    return Api.success({ message: 'Game updated successfully.', game: updated });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    await AdminGameService.deleteGame(params.id, user.userId);
    return Api.success({ message: 'Game deleted successfully.' });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
