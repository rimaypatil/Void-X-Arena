import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminSettingService } from '@/lib/admin/adminSettingService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const banners = await AdminSettingService.listBanners();
    return Api.success(banners);
  } catch (error: any) {
    return Api.serverError('Failed to fetch banners', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const body = await request.json().catch(() => null);
    if (!body || !body.title || !body.imageUrl) {
      return Api.badRequest('Required fields: "title" and "imageUrl".');
    }

    const banner = await AdminSettingService.createBanner({
      title: body.title,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
      adminUserId: user.userId,
    });

    return Api.created({ message: 'Banner created successfully.', banner });
  } catch (error: any) {
    return Api.badRequest(error.message);
  }
}
