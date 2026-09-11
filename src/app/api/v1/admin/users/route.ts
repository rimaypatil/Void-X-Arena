import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminUserService } from '@/lib/admin/adminUserService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await AdminUserService.listUsers({
      status,
      search,
      page,
      limit,
    });

    return Api.success(result);
  } catch (error: any) {
    return Api.serverError('Failed to fetch users', error.message);
  }
}
