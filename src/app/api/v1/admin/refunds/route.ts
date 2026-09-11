import { NextRequest } from 'next/server';
import { Api } from '@/lib/api/response';
import { AuthMiddleware } from '@/lib/auth/middleware';
import { AdminFinanceService } from '@/lib/admin/adminFinanceService';

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await AuthMiddleware.requireAdmin(request);
    if (errorResponse || !user) return errorResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const result = await AdminFinanceService.listRefunds({
      status,
      page,
      limit,
    });

    return Api.success(result);
  } catch (error: any) {
    return Api.serverError('Failed to fetch refunds', error.message);
  }
}
