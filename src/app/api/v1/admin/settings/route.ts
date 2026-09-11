import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminSettingService } from '@/lib/admin/adminSettingService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const settings = await AdminSettingService.getSettings();
    return Api.success(settings);
  } catch (error: any) {
    return Api.serverError('Failed to fetch settings', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || !body.key || body.value === undefined) {
      return Api.badRequest('Both "key" and "value" are required.');
    }

    const updated = await AdminSettingService.updateSetting(body.key, body.value, user.userId);
    return Api.success({ message: `Setting "${body.key}" updated.`, setting: updated });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
