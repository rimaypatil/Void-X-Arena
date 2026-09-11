import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminSettingService } from '@/lib/admin/adminSettingService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body) return Api.badRequest('Invalid payload.');

    const updated = await AdminSettingService.updateBanner(params.id, body, user.userId);
    return Api.success({ message: 'Banner updated.', banner: updated });
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

    await AdminSettingService.deleteBanner(params.id, user.userId);
    return Api.success({ message: 'Banner deleted.' });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
